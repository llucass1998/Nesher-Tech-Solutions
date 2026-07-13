import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { createOpaqueToken, hashIp, hashToken, signAccessToken } from '../lib/auth-tokens';
import { sendError } from '../lib/api-error';

const authRoleSchema = z.enum(['ADMIN', 'OPERATOR', 'DRIVER', 'SUPPORT', 'CUSTOMER']);

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: authRoleSchema.default('DRIVER'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(user: { id: string; name: string; email: string; role: string; status: string }) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roles: [user.role],
    status: user.status,
  };
}

function refreshExpiresAt() {
  const days = Number(process.env.REFRESH_TOKEN_TTL_DAYS || 7);
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export class AuthV1Controller {
  async register(req: Request, res: Response) {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Payload invalido.', { issues: parsed.error.issues });
    }

    const { name, email, password, phone, role } = parsed.data;

    if (role !== 'DRIVER' && role !== 'CUSTOMER') {
      return sendError(res, 403, 'ACCESS_DENIED', 'Criacao publica desta role nao permitida.');
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return sendError(res, 409, 'DUPLICATE_EMAIL', 'E-mail ja cadastrado.');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name,
          email,
          passwordHash,
          role,
          status: 'ACTIVE',
        },
      });

      if (role === 'DRIVER') {
        const driver = await tx.driver.create({
          data: {
            name,
            email,
            password: passwordHash,
            phone: phone ?? '',
          },
        });

        await tx.driverProfile.create({
          data: {
            userId: user.id,
            driverId: driver.id,
            phone: phone ?? '',
            status: driver.status,
          },
        });
      }

      return user;
    });

    return this.issueSession(req, res, result, 201);
  }

  async login(req: Request, res: Response) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'Payload invalido.', { issues: parsed.error.issues });
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (!user || user.status !== 'ACTIVE') {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
    }

    const passwordMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);
    if (!passwordMatch) {
      return sendError(res, 401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
    }

    return this.issueSession(req, res, user, 200);
  }

  async refresh(req: Request, res: Response) {
    const refreshToken = this.getRefreshToken(req);
    if (!refreshToken) {
      return sendError(res, 401, 'AUTHENTICATION_REQUIRED', 'Refresh token nao fornecido.');
    }

    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash: hashToken(refreshToken) },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
      return sendError(res, 401, 'TOKEN_EXPIRED', 'Sessao expirada.');
    }

    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueSession(req, res, session.user, 200);
  }

  async logout(req: Request, res: Response) {
    const refreshToken = this.getRefreshToken(req);
    if (refreshToken) {
      await prisma.refreshSession.update({
        where: { tokenHash: hashToken(refreshToken) },
        data: { revokedAt: new Date() },
      }).catch(() => undefined);
    }

    res.clearCookie('refreshToken');
    return res.status(204).send();
  }

  async me(req: Request, res: Response) {
    const auth = req.auth;
    if (!auth) {
      return sendError(res, 401, 'AUTHENTICATION_REQUIRED', 'Autenticacao obrigatoria.');
    }

    return res.json({ user: publicUser(auth) });
  }

  private async issueSession(
    req: Request,
    res: Response,
    user: { id: string; name: string; email: string; role: string; status: string },
    statusCode: number
  ) {
    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      name: user.name,
      roles: [user.role],
      status: user.status,
    });

    const refreshToken = createOpaqueToken();

    await prisma.refreshSession.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        userAgent: req.headers['user-agent'] ?? null,
        ipHash: hashIp(req.ip),
        expiresAt: refreshExpiresAt(),
      },
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/v1/auth',
    });

    return res.status(statusCode).json({
      user: publicUser(user),
      accessToken,
    });
  }

  private getRefreshToken(req: Request) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    const refreshCookie = cookies.find((cookie) => cookie.startsWith('refreshToken='));
    if (!refreshCookie) return null;

    return decodeURIComponent(refreshCookie.slice('refreshToken='.length));
  }
}
