import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, LoginDto } from './dto';
import { getIdentityKeyId, getIdentityPrivateKey, getIdentityPublicKey } from './key-store';

type IdentityUser = Awaited<ReturnType<AuthService['findUserByEmail']>>;

export interface IdentityClaims extends JwtPayload {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  status: string;
  sessionId: string;
}

const defaultRoles = ['DRIVER'];
const defaultAudiences = ['logiflow', 'logidesk', 'logipeople', 'logipayroll'];

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(input: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new ConflictException({ code: 'DUPLICATE_EMAIL', error: 'Email already exists.' });

    const roles = input.roles?.length ? input.roles : defaultRoles;
    const permissions = input.permissions ?? [];
    const audiences = input.audiences?.length ? input.audiences : defaultAudiences;
    const passwordHash = await bcrypt.hash(input.password, 10);

    const user = await this.prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: input.name,
          email: input.email,
          credentials: {
            create: {
              secretHash: passwordHash,
            },
          },
        },
      });

      const roleIds: string[] = [];

      for (const roleKey of roles) {
        const role = await tx.role.upsert({
          where: { key: roleKey },
          update: {},
          create: { key: roleKey, name: roleKey },
        });
        roleIds.push(role.id);
        await tx.userRole.create({ data: { userId: created.id, roleId: role.id } });
      }

      for (const permissionKey of permissions) {
        const permission = await tx.permission.upsert({
          where: { key: permissionKey },
          update: {},
          create: { key: permissionKey },
        });

        for (const roleId of roleIds) {
          await tx.rolePermission.upsert({
            where: { roleId_permissionId: { roleId, permissionId: permission.id } },
            update: {},
            create: { roleId, permissionId: permission.id },
          });
        }
      }

      for (const audience of audiences) {
        const application = await tx.application.upsert({
          where: { audience },
          update: {},
          create: { key: audience, name: audience, audience },
        });
        await tx.applicationAccess.create({ data: { applicationId: application.id, userId: created.id } });
      }

      await tx.auditLog.create({
        data: {
          action: 'identity.user.created',
          entityType: 'User',
          entityId: created.id,
          after: { email: created.email, roles, permissions, audiences },
        },
      });

      return created;
    });

    return { user: await this.publicUserById(user.id) };
  }

  async login(input: LoginDto, req: Request, res: Response) {
    const user = await this.findUserByEmail(input.email);
    const passwordCredential = user?.credentials.find((credential) => credential.type === 'PASSWORD' && credential.active);
    const success = Boolean(user && user.status === 'ACTIVE' && passwordCredential && await bcrypt.compare(input.password, passwordCredential.secretHash));

    await this.prisma.loginAttempt.create({
      data: {
        email: input.email,
        success,
        ...(user ? { userId: user.id } : {}),
        ipHash: hashValue(req.ip),
        userAgent: req.headers['user-agent'] ?? null,
        ...(success ? {} : { reason: 'INVALID_CREDENTIALS' }),
      },
    });

    if (!success || !user) {
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', error: 'Invalid credentials.' });
    }

    return this.issueSession(user, req, res);
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = this.getRefreshToken(req);
    if (!refreshToken) throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED', error: 'Refresh token required.' });

    const session = await this.prisma.refreshSession.findUnique({
      where: { tokenHash: hashValue(refreshToken) },
      include: { user: { include: this.userIncludes() } },
    });

    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException({ code: 'TOKEN_EXPIRED', error: 'Refresh token expired.' });
    }

    await this.prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(session.user, req, res, session.id);
  }

  async logout(req: Request, res: Response) {
    const refreshToken = this.getRefreshToken(req);
    if (refreshToken) {
      await this.prisma.refreshSession.update({
        where: { tokenHash: hashValue(refreshToken) },
        data: { revokedAt: new Date() },
      }).catch(() => undefined);
    }

    res.clearCookie('identityRefreshToken', { path: '/api/v1/auth' });
    return { status: 'ok' };
  }

  async me(authorization?: string) {
    const claims = this.verifyBearer(authorization);
    return { user: await this.publicUserById(claims.sub), claims };
  }

  async sessions(authorization?: string) {
    const claims = this.verifyBearer(authorization);
    return this.prisma.refreshSession.findMany({
      where: { userId: claims.sub },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        expiresAt: true,
        revokedAt: true,
        createdAt: true,
        replacedById: true,
      },
    });
  }

  async revokeSession(authorization: string | undefined, sessionId: string) {
    const claims = this.verifyBearer(authorization);
    const session = await this.prisma.refreshSession.findFirst({ where: { id: sessionId, userId: claims.sub } });
    if (!session) throw new NotFoundException({ error: 'Session not found.' });
    return this.prisma.refreshSession.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  async revokeAllSessions(authorization?: string) {
    const claims = this.verifyBearer(authorization);
    const result = await this.prisma.refreshSession.updateMany({
      where: { userId: claims.sub, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revoked: result.count };
  }

  private async issueSession(user: NonNullable<IdentityUser>, req: Request, res: Response, replacedSessionId?: string) {
    const roles = user.roles.map((entry) => entry.role.key);
    const permissions = unique(user.roles.flatMap((entry) => entry.role.permissions.map((permission) => permission.permission.key)));
    const audiences = user.applicationAccess.map((entry) => entry.application.audience);
    const refreshToken = crypto.randomBytes(48).toString('base64url');
    const session = await this.prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: hashValue(refreshToken),
        userAgent: req.headers['user-agent'] ?? null,
        ipHash: hashValue(req.ip),
        expiresAt: refreshExpiresAt(),
        ...(replacedSessionId ? { replacedById: replacedSessionId } : {}),
      },
    });

    if (replacedSessionId) {
      await this.prisma.refreshSession.update({ where: { id: replacedSessionId }, data: { replacedById: session.id } });
    }

    const accessToken = jwt.sign({
      sub: user.id,
      email: user.email,
      name: user.name,
      roles,
      permissions,
      status: user.status,
      sessionId: session.id,
      jti: crypto.randomUUID(),
    }, getIdentityPrivateKey(), {
      algorithm: 'RS256',
      keyid: getIdentityKeyId(),
      issuer: process.env.IDENTITY_ISSUER || 'logiidentity',
      audience: audiences.length ? audiences : defaultAudiences,
      expiresIn: Number(process.env.IDENTITY_ACCESS_TOKEN_TTL_SECONDS || 900),
    });

    res.cookie('identityRefreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: (process.env.IDENTITY_COOKIE_SAMESITE as 'lax' | 'strict' | 'none' | undefined) ?? 'lax',
      path: '/api/v1/auth',
    });

    return {
      user: this.toPublicUser(user, roles, permissions, audiences),
      accessToken,
    };
  }

  private verifyBearer(authorization?: string) {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED', error: 'Bearer token required.' });
    }

    return jwt.verify(authorization.slice('Bearer '.length), getIdentityPublicKey(), {
      algorithms: ['RS256'],
      issuer: process.env.IDENTITY_ISSUER || 'logiidentity',
    }) as IdentityClaims;
  }

  private async publicUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.userIncludes(),
    });
    if (!user) throw new NotFoundException({ error: 'User not found.' });

    const roles = user.roles.map((entry) => entry.role.key);
    const permissions = unique(user.roles.flatMap((entry) => entry.role.permissions.map((permission) => permission.permission.key)));
    const audiences = user.applicationAccess.map((entry) => entry.application.audience);
    return this.toPublicUser(user, roles, permissions, audiences);
  }

  private toPublicUser(user: NonNullable<IdentityUser>, roles: string[], permissions: string[], audiences: string[]) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      roles,
      permissions,
      audiences,
    };
  }

  private findUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: this.userIncludes(),
    });
  }

  private userIncludes() {
    return {
      credentials: true,
      roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      applicationAccess: { include: { application: true } },
    } as const;
  }

  private getRefreshToken(req: Request) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const refreshCookie = cookies.find((cookie) => cookie.startsWith('identityRefreshToken='));
    if (!refreshCookie) return null;

    return decodeURIComponent(refreshCookie.slice('identityRefreshToken='.length));
  }
}

function hashValue(value: string | undefined | null) {
  return crypto.createHash('sha256').update(value ?? '').digest('hex');
}

function refreshExpiresAt() {
  const days = Number(process.env.IDENTITY_REFRESH_TOKEN_TTL_DAYS || 7);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function unique(values: string[]) {
  return [...new Set(values)];
}
