import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { describe, expect, it, vi } from 'vitest';
import { PayslipsService } from '../src/modules/payslips/payslips.service';

function createPayslipsService() {
  const payrollRunFindUnique = vi.fn().mockResolvedValue({
    id: 'run-1',
    companyId: 'company-1',
    employeeId: 'employee-1',
    status: 'REVIEWED',
    grossAmount: '12500.55',
    deductionAmount: '1500.25',
    netAmount: '11000.30',
    currency: 'BRL',
    cycle: {
      id: 'cycle-1',
      status: 'OPEN',
      referenceMonth: 7,
      referenceYear: 2026,
    },
    items: [
      {
        id: 'item-1',
        employeeId: 'employee-1',
        type: 'EARNING',
        code: 'BASE',
        description: 'Base salary evidence',
        quantity: '1.0000',
        amount: '12500.55',
        currency: 'BRL',
      },
      {
        id: 'item-2',
        employeeId: 'employee-1',
        type: 'DEDUCTION',
        code: 'DISC',
        description: 'Preliminary discount evidence',
        quantity: null,
        amount: '1500.25',
        currency: 'BRL',
      },
    ],
  });
  const payslipFindUnique = vi.fn().mockResolvedValue(null);
  const payslipCreate = vi.fn().mockResolvedValue({
    id: 'payslip-1',
    payrollRunId: 'run-1',
    employeeId: 'employee-1',
    visibleToEmployee: false,
    legalValidationPending: true,
    lines: [{ id: 'line-1' }, { id: 'line-2' }],
  });

  const prisma = {
    payrollRun: {
      findUnique: payrollRunFindUnique,
    },
    payslip: {
      findMany: vi.fn(),
      findUnique: payslipFindUnique,
      create: payslipCreate,
    },
    payslipLine: {
      findMany: vi.fn(),
    },
  };

  const audit = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new PayslipsService(prisma as never, audit as never),
    audit,
    payrollRunFindUnique,
    payslipFindUnique,
    payslipCreate,
  };
}

const principal: AuthenticatedPrincipal = {
  userId: 'user-1',
  roles: ['PAYROLL_MANAGER'],
  scopes: [{ type: 'COMPANY', id: 'company-1' }],
};

describe('PayslipsService', () => {
  it('creates a preliminary payslip from a payroll run without publishing it to the employee', async () => {
    const context = createPayslipsService();

    await expect(
      context.service.createPayslip(
        {
          payrollRunId: 'run-1',
          reason: 'Generate preliminary payslip evidence',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'payslip-1', visibleToEmployee: false, legalValidationPending: true });

    expect(context.payslipCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          payrollRunId: 'run-1',
          employeeId: 'employee-1',
          referenceMonth: 7,
          referenceYear: 2026,
          visibleToEmployee: false,
          recordedBy: 'user-1',
          source: 'logipeople-api',
          lines: expect.objectContaining({
            create: expect.arrayContaining([
              expect.objectContaining({ payrollItemId: 'item-1', code: 'BASE' }),
              expect.objectContaining({ payrollItemId: 'item-2', code: 'DISC' }),
            ]),
          }),
        }),
        include: { lines: true },
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'payslip.created',
        entityType: 'Payslip',
        entityId: 'payslip-1',
      }),
    );
  });

  it('returns an existing payslip for the same payroll run without duplicating lines', async () => {
    const context = createPayslipsService();
    context.payslipFindUnique.mockResolvedValue({ id: 'payslip-1', payrollRunId: 'run-1' });

    await expect(context.service.createPayslip({ payrollRunId: 'run-1', reason: 'Idempotent request' }, principal)).resolves.toMatchObject({ id: 'payslip-1' });

    expect(context.payslipCreate).not.toHaveBeenCalled();
    expect(context.audit.record).not.toHaveBeenCalled();
  });

  it('rejects payslip creation for closed payroll runs or cycles', async () => {
    const context = createPayslipsService();
    context.payrollRunFindUnique.mockResolvedValue({
      id: 'run-1',
      companyId: 'company-1',
      employeeId: 'employee-1',
      status: 'CLOSED',
      cycle: { status: 'OPEN' },
      items: [],
    });

    await expect(context.service.createPayslip({ payrollRunId: 'run-1', reason: 'Invalid closed payroll evidence' })).rejects.toThrow(BadRequestException);
  });

  it('rejects payslip creation when the payroll run company is outside the principal scope', async () => {
    const context = createPayslipsService();
    const outOfScopePrincipal: AuthenticatedPrincipal = {
      ...principal,
      scopes: [{ type: 'COMPANY', id: 'company-2' }],
    };

    await expect(context.service.createPayslip({ payrollRunId: 'run-1', reason: 'Out of scope payslip evidence' }, outOfScopePrincipal)).rejects.toThrow(ForbiddenException);
    expect(context.payslipCreate).not.toHaveBeenCalled();
    expect(context.audit.record).not.toHaveBeenCalled();
  });
});
