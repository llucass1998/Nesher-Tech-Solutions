import { Injectable, UnauthorizedException } from '@nestjs/common';
import crypto from 'crypto';
import type { JsonWebKey as CryptoJsonWebKey } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';

type JwksKey = JsonWebKey & { kid?: string };

export interface LogiIdentityClaims extends JwtPayload {
  sub: string;
  email: string;
  name: string;
  roles?: string[];
  permissions?: string[];
  status?: string;
  sessionId?: string;
}

@Injectable()
export class IdentityJwksService {
  private cache: { fetchedAt: number; keys: JwksKey[] } | null = null;

  async verifyAuthorizationHeader(authorization?: string): Promise<LogiIdentityClaims> {
    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException({ code: 'AUTHENTICATION_REQUIRED', error: 'Bearer token required.' });
    }

    return this.verify(authorization.slice('Bearer '.length));
  }

  async verify(token: string): Promise<LogiIdentityClaims> {
    const jwksUrl = process.env.IDENTITY_JWKS_URL;
    if (!jwksUrl) {
      throw new UnauthorizedException({ code: 'IDENTITY_NOT_CONFIGURED', error: 'Identity JWKS URL is not configured.' });
    }

    const decodedHeader = jwt.decode(token, { complete: true });
    const kid = typeof decodedHeader === 'object' && decodedHeader ? decodedHeader.header.kid : undefined;
    const keys = await this.getKeys(jwksUrl);
    const jwk = keys.find((key) => key.kid === kid) ?? keys[0];

    if (!jwk) {
      throw new UnauthorizedException({ code: 'IDENTITY_JWKS_EMPTY', error: 'Identity JWKS has no keys.' });
    }

    const decoded = jwt.verify(token, crypto.createPublicKey({ key: jwk as CryptoJsonWebKey, format: 'jwk' }), {
      algorithms: ['RS256'],
      issuer: process.env.IDENTITY_ISSUER || 'logiidentity',
      audience: process.env.IDENTITY_AUDIENCE || 'logidesk',
    });

    if (typeof decoded === 'string') {
      throw new UnauthorizedException({ code: 'INVALID_TOKEN', error: 'Invalid token payload.' });
    }

    return decoded as LogiIdentityClaims;
  }

  private async getKeys(jwksUrl: string) {
    const now = Date.now();
    if (this.cache && now - this.cache.fetchedAt < 60_000) {
      return this.cache.keys;
    }

    const response = await fetch(jwksUrl);
    if (!response.ok) {
      throw new UnauthorizedException({ code: 'IDENTITY_JWKS_UNAVAILABLE', error: 'Identity JWKS unavailable.' });
    }

    const body = await response.json() as { keys?: JwksKey[] };
    this.cache = { fetchedAt: now, keys: body.keys ?? [] };
    return this.cache.keys;
  }
}
