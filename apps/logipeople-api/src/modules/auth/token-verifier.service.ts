import { Injectable, UnauthorizedException } from '@nestjs/common';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { accessScopeSchema, roleSchema } from '@logipeople/contracts';
import { AuthenticatedPrincipal } from '@logipeople/auth';

interface LogiIdentityClaims extends JwtPayload {
  sub: string;
  employeeId?: string;
  roles?: unknown;
  scopes?: unknown;
}

@Injectable()
export class TokenVerifier {
  verify(token: string): AuthenticatedPrincipal {
    const secret = process.env.LOGIIDENTITY_JWT_SECRET;

    if (!secret) {
      throw new UnauthorizedException({ error: 'Validação JWT não configurada.' });
    }

    const decoded = jwt.verify(token, secret, {
      issuer: process.env.LOGIIDENTITY_ISSUER || undefined,
      audience: process.env.LOGIIDENTITY_AUDIENCE || undefined,
    }) as LogiIdentityClaims;

    if (!decoded.sub) {
      throw new UnauthorizedException({ error: 'Token inválido.' });
    }

    const parsedRoles = roleSchema.array().safeParse(decoded.roles ?? []);
    const parsedScopes = accessScopeSchema.array().safeParse(decoded.scopes ?? []);

    if (!parsedRoles.success || !parsedScopes.success) {
      throw new UnauthorizedException({ error: 'Token sem papéis ou escopos válidos.' });
    }

    return {
      userId: decoded.sub,
      ...(decoded.employeeId ? { employeeId: decoded.employeeId } : {}),
      roles: parsedRoles.data,
      scopes: parsedScopes.data,
    };
  }
}
