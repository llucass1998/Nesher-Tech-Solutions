import { describe, expect, it, vi } from 'vitest';
import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('returns the authenticated Identity user without sensitive token data', async () => {
    const identityJwks = {
      verifyAuthorizationHeader: vi.fn().mockResolvedValue({
        sub: 'identity-user-1',
        email: 'user@example.com',
        name: 'Identity User',
        roles: ['ADMIN'],
        permissions: ['logipayroll.payroll.read'],
        status: 'ACTIVE',
        sessionId: 'session-1',
      }),
    };
    const controller = new AuthController(identityJwks as never);

    await expect(controller.me('Bearer token')).resolves.toEqual({
      user: {
        id: 'identity-user-1',
        email: 'user@example.com',
        name: 'Identity User',
        roles: ['ADMIN'],
        permissions: ['logipayroll.payroll.read'],
        status: 'ACTIVE',
      },
    });

    expect(identityJwks.verifyAuthorizationHeader).toHaveBeenCalledWith('Bearer token');
  });
});
