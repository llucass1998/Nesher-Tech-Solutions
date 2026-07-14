import { UnauthorizedException } from '@nestjs/common';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IdentityJwksService } from './identity-jwks.service';

const previousEnv = { ...process.env };

function createIdentityToken(input?: { audience?: string }) {
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const kid = 'identity-test-key';
  const publicJwk = publicKey.export({ format: 'jwk' });
  const token = jwt.sign({
    sub: 'payroll-user-1',
    email: 'payroll@example.com',
    name: 'Payroll Admin',
    roles: ['ADMIN'],
    permissions: ['logipayroll.contract.read'],
    status: 'ACTIVE',
    sessionId: 'session-1',
  }, privateKey, {
    algorithm: 'RS256',
    issuer: 'logiidentity',
    audience: input?.audience ?? 'logipayroll',
    keyid: kid,
    expiresIn: '5m',
  });

  return {
    token,
    jwks: {
      keys: [{ ...publicJwk, kid, alg: 'RS256', use: 'sig' }],
    },
  };
}

afterEach(() => {
  process.env = { ...previousEnv };
  vi.unstubAllGlobals();
});

describe('IdentityJwksService', () => {
  it('rejects requests without bearer token', async () => {
    const service = new IdentityJwksService();

    await expect(service.verifyAuthorizationHeader()).rejects.toThrow(UnauthorizedException);
  });

  it('rejects invalid bearer token', async () => {
    process.env.IDENTITY_JWKS_URL = 'http://identity.test/.well-known/jwks.json';
    const service = new IdentityJwksService();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ keys: [] }),
    }));

    await expect(service.verifyAuthorizationHeader('Bearer invalid-token')).rejects.toThrow(UnauthorizedException);
  });

  it('accepts a valid LogiIdentity RS256 token for the LogiPayroll audience', async () => {
    process.env.IDENTITY_JWKS_URL = 'http://identity.test/.well-known/jwks.json';
    process.env.IDENTITY_ISSUER = 'logiidentity';
    process.env.IDENTITY_AUDIENCE = 'logipayroll';
    const { token, jwks } = createIdentityToken();
    const service = new IdentityJwksService();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(jwks),
    }));

    const claims = await service.verifyAuthorizationHeader(`Bearer ${token}`);

    expect(claims.sub).toBe('payroll-user-1');
    expect(claims.email).toBe('payroll@example.com');
    expect(claims.roles).toEqual(['ADMIN']);
    expect(claims.permissions).toEqual(['logipayroll.contract.read']);
  });

  it('rejects a valid token issued for another audience', async () => {
    process.env.IDENTITY_JWKS_URL = 'http://identity.test/.well-known/jwks.json';
    process.env.IDENTITY_ISSUER = 'logiidentity';
    process.env.IDENTITY_AUDIENCE = 'logipayroll';
    const { token, jwks } = createIdentityToken({ audience: 'logidesk' });
    const service = new IdentityJwksService();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(jwks),
    }));

    await expect(service.verifyAuthorizationHeader(`Bearer ${token}`)).rejects.toThrow(UnauthorizedException);
  });
});
