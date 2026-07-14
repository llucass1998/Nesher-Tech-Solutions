import { describe, expect, it, vi } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';

function createPrismaMock() {
  const user = {
    id: 'user-1',
    name: 'Operador',
    email: 'operator@example.com',
    status: 'ACTIVE',
    credentials: [],
    roles: [{ role: { key: 'OPERATOR', permissions: [{ permission: { key: 'logiflow.delivery.read' } }] } }],
    applicationAccess: [{ application: { audience: 'logiflow' } }, { application: { audience: 'logidesk' } }],
  };

  return {
    user,
    prisma: {
      user: {
        findUnique: vi.fn().mockResolvedValue(user),
        create: vi.fn().mockResolvedValue(user),
      },
      credential: {},
      loginAttempt: { create: vi.fn().mockResolvedValue({}) },
      refreshSession: {
        create: vi.fn().mockResolvedValue({ id: 'session-1' }),
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({}),
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      role: { upsert: vi.fn().mockResolvedValue({ id: 'role-1' }) },
      userRole: { create: vi.fn().mockResolvedValue({}) },
      permission: { upsert: vi.fn().mockResolvedValue({}) },
      application: { upsert: vi.fn().mockResolvedValue({ id: 'app-1' }) },
      applicationAccess: { create: vi.fn().mockResolvedValue({}) },
      auditLog: { create: vi.fn().mockResolvedValue({}) },
      $transaction: vi.fn(async (callback: (tx: unknown) => unknown) => callback(createPrismaMock().prisma)),
    },
  };
}

describe('AuthService', () => {
  it('creates access token with platform audiences and session id', async () => {
    const context = createPrismaMock();
    const service = new AuthService(context.prisma as never);
    const response = {
      cookie: vi.fn(),
    };

    const result = await service['issueSession'](
      context.user as never,
      { ip: '127.0.0.1', headers: { 'user-agent': 'vitest' } } as never,
      response as never,
    );

    expect(result.user.roles).toEqual(['OPERATOR']);
    expect(result.user.permissions).toEqual(['logiflow.delivery.read']);
    expect(result.accessToken).toEqual(expect.any(String));
    expect(response.cookie).toHaveBeenCalledWith('identityRefreshToken', expect.any(String), expect.objectContaining({ httpOnly: true }));
  });
});
