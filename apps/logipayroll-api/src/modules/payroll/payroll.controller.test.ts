import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { PayrollController } from './payroll.controller';

function createController() {
  const payrollService = {
    capabilities: vi.fn(),
    listContracts: vi.fn().mockResolvedValue([{ id: 'contract-1' }]),
    createContract: vi.fn().mockResolvedValue({ id: 'contract-1' }),
  };
  const identityJwks = {
    verifyAuthorizationHeader: vi.fn().mockResolvedValue({
      sub: 'payroll-admin-1',
      email: 'payroll@example.com',
      name: 'Payroll Admin',
      roles: ['PAYROLL_ADMIN'],
      permissions: [],
      sessionId: 'session-1',
    }),
  };

  return {
    controller: new PayrollController(payrollService as never, identityJwks as never),
    payrollService,
    identityJwks,
  };
}

describe('PayrollController contracts authorization', () => {
  it('rejects contract listing without an Identity bearer token', async () => {
    const context = createController();
    context.identityJwks.verifyAuthorizationHeader.mockRejectedValue(new UnauthorizedException());

    await expect(context.controller.listContracts(undefined)).rejects.toThrow(UnauthorizedException);
    expect(context.payrollService.listContracts).not.toHaveBeenCalled();
  });

  it('rejects contract writes without LogiPayroll permission or admin role', async () => {
    const context = createController();
    context.identityJwks.verifyAuthorizationHeader.mockResolvedValue({
      sub: 'employee-1',
      email: 'employee@example.com',
      name: 'Employee',
      roles: ['EMPLOYEE'],
      permissions: ['logipeople.employee.read'],
    });

    await expect(context.controller.createContract({
      employee: {
        fullName: 'Employee One',
      },
      type: 'CLT',
      startsAt: '2026-07-14T00:00:00.000Z',
    }, 'Bearer token')).rejects.toThrow(ForbiddenException);
    expect(context.payrollService.createContract).not.toHaveBeenCalled();
  });

  it('allows users with contract write permission to create contracts', async () => {
    const context = createController();
    context.identityJwks.verifyAuthorizationHeader.mockResolvedValue({
      sub: 'hr-manager-1',
      email: 'hr@example.com',
      name: 'HR Manager',
      roles: ['HR_MANAGER'],
      permissions: ['logipayroll.contract.write'],
      sessionId: 'session-1',
    });
    const payload = {
      employee: {
        fullName: 'Employee One',
      },
      type: 'CLT',
      startsAt: '2026-07-14T00:00:00.000Z',
    };

    await expect(context.controller.createContract(payload, 'Bearer token', 'corr-1')).resolves.toEqual({ id: 'contract-1' });
    expect(context.payrollService.createContract).toHaveBeenCalledWith(expect.objectContaining(payload), expect.objectContaining({
      sub: 'hr-manager-1',
    }), 'corr-1');
  });
});
