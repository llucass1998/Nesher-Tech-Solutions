import crypto from 'crypto';
import type { JsonWebKey as CryptoJsonWebKey } from 'crypto';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { verifyAccessToken } from './auth-tokens';

export interface PlatformIdentityClaims extends JwtPayload {
  sub: string;
  email: string;
  name: string;
  roles?: string[];
  permissions?: string[];
  status?: string;
  sessionId?: string;
}

type JwksKey = JsonWebKey & { kid?: string };

let jwksCache: { fetchedAt: number; keys: JwksKey[] } | null = null;

export async function verifyPlatformAccessToken(token: string): Promise<PlatformIdentityClaims> {
  if (!process.env.IDENTITY_JWKS_URL) {
    return verifyAccessToken(token) as PlatformIdentityClaims;
  }

  const decodedHeader = jwt.decode(token, { complete: true });
  const kid = typeof decodedHeader === 'object' && decodedHeader ? decodedHeader.header.kid : undefined;
  const keys = await getJwksKeys();
  const jwk = keys.find((key) => key.kid === kid) ?? keys[0];

  if (!jwk) {
    throw new Error('Identity JWKS has no signing keys.');
  }

  const publicKey = crypto.createPublicKey({ key: jwk as CryptoJsonWebKey, format: 'jwk' });
  const decoded = jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: process.env.IDENTITY_ISSUER || 'logiidentity',
    audience: getAudience(),
  });

  if (typeof decoded === 'string') {
    throw new Error('Invalid token payload.');
  }

  return decoded as PlatformIdentityClaims;
}

async function getJwksKeys() {
  const now = Date.now();
  if (jwksCache && now - jwksCache.fetchedAt < 60_000) {
    return jwksCache.keys;
  }

  const response = await fetch(process.env.IDENTITY_JWKS_URL as string);
  if (!response.ok) {
    throw new Error(`Identity JWKS request failed with ${response.status}.`);
  }

  const body = await response.json() as { keys?: JwksKey[] };
  jwksCache = { fetchedAt: now, keys: body.keys ?? [] };
  return jwksCache.keys;
}

function getAudience() {
  return process.env.IDENTITY_AUDIENCE || process.env.JWT_VERIFY_AUDIENCE || 'logiflow';
}
