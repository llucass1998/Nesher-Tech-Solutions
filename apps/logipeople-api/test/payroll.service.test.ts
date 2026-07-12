import { BadRequestException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { describe, expect, it, vi } from 'vitest';
import { PayrollService } from '../src/modules/payroll/payroll.service';

function createPayrollService() {
  const companyFindUnique = vi.fn().mockResolvedValue({ id: 'company-1' });
  const employeeFindUnique = vi.fn().mockResolvedValue({ id: 'employee-1', companyId: 'company-1' });
  const payrollCycleFindUnique = vi.fn().mockResolvedValue({ id: 'cycle-1', companyId: 'company-1', status: 'DRAFT' });
  const payrollCycleCreate = vi.fn().mockResolvedValue({
    id: 'cycle-1',
    companyId: 'company-1',
    referenceMonth: 7,
    referenceYear: 2026,
    legalValidationPending: true,
  });
  const payrollRunCreate = vi.fn().mockResolvedValue({
    id: 'run-1',
    cycleId: 'cycle-1',
    companyId: 'company-1',
    employeeId: 'employee-1',
    legalValidationPending: true,
  });
  const payrollRunFindUnique = vi.fn().mockResolvedValue({
    id: 'run-1',
    employeeId: 'employee-1',
    status: 'DRAFT',
    cycle: { id: 'cycle-1', status: 'DRAFT' },
  });
  const payrollItemCreate = vi.fn().mockResolvedValue({
    id: 'item-1',
    runId: 'run-1',
    employeeId: 'employee-1',
    type: 'EARNING',
    code: 'BASE',
    legalValidationPending: true,
  });
  const payrollReopeningCreate = vi.fn().mockResolvedValue({
    id: 'reopening-1',
    cycleId: 'cycle-1',
    status: 'REQUESTED',
  });

  const prisma = {
    company: {
      findUnique: companyFindUnique,
    },
    employee: {
      findUnique: employeeFindUnique,
    },
    payrollCycle: {
      findMany: vi.fn(),
      findUnique: payrollCycleFindUnique,
      create: payrollCycleCreate,
    },
    payrollRun: {
      findMany: vi.fn(),
      findUnique: payrollRunFindUnique,
      create: payrollRunCreate,
    },
    payrollItem: {
      findMany: vi.fn(),
      create: payrollItemCreate,
    },
    payrollReopening: {
      create: payrollReopeningCreate,
    },
  };

  const audit = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new PayrollService(prisma as never, audit as never),
    audit,
    companyFindUnique,
    employeeFindUnique,
    payrollCycleFindUnique,
    payrollCycleCreate,
    payrollRunCreate,
    payrollRunFindUnique,
    payrollItemCreate,
    payrollReopeningCreate,
  };
}

const principal: AuthenticatedPrincipal = {
  userId: 'user-1',
  roles: ['PAYROLL_MANAGER'],
  scopes: [{ type: 'COMPANY', id: 'company-1' }],
};

describe('PayrollService', () => {
  it('creates a preliminary payroll cycle with legal validation pending', async () => {
    const context = createPayrollService();

    await expect(
      context.service.createCycle(
        {
          companyId: 'company-1',
          name: 'Folha julho 2026',
          referenceMonth: 7,
          referenceYear: 2026,
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          reason: 'Initial payroll setup',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'cycle-1', legalValidationPending: true });

    expect(context.payrollCycleCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          referenceMonth: 7,
          referenceYear: 2026,
          recordedBy: 'user-1',
          source: 'logipeople-api',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'payroll.cycle.created',
        entityType: 'PayrollCycle',
        entityId: 'cycle-1',
      }),
    );
  });

  it('creates a payroll run using Decimal-compatible monetary strings', async () => {
    const context = createPayrollService();

    await expect(
      context.service.createRun(
        {
          cycleId: 'cycle-1',
          companyId: 'company-1',
          employeeId: 'employee-1',
          grossAmount: '12500.55',
          deductionAmount: '1500.25',
          netAmount: '11000.30',
          currency: 'BRL',
          reason: 'Preliminary payroll evidence',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'run-1', legalValidationPending: true });

    expect(context.payrollRunCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cycleId: 'cycle-1',
          employeeId: 'employee-1',
          currency: 'BRL',
          recordedBy: 'user-1',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'payroll.run.created',
        entityType: 'PayrollRun',
        entityId: 'run-1',
      }),
    );
  });

  it('creates a payroll item without calculating legal payroll results', async () => {
    const context = createPayrollService();

    await expect(
      context.service.createItem(
        {
          runId: 'run-1',
          employeeId: 'employee-1',
          type: 'EARNING',
          source: 'MANUAL',
          code: 'BASE',
          description: 'Base salary evidence',
          quantity: '1.0000',
          amount: '12500.55',
          currency: 'BRL',
          taxable: true,
          reason: 'Manual preliminary payroll item',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'item-1', legalValidationPending: true });

    expect(context.payrollItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          runId: 'run-1',
          employeeId: 'employee-1',
          type: 'EARNING',
          source: 'MANUAL',
          code: 'BASE',
          taxable: true,
          recordedBy: 'user-1',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'payroll.item.created',
        entityType: 'PayrollItem',
        entityId: 'item-1',
      }),
    );
  });

  it('rejects changes to a closed payroll cycle before audited reopening', async () => {
    const context = createPayrollService();
    context.payrollCycleFindUnique.mockResolvedValue({ id: 'cycle-1', companyId: 'company-1', status: 'CLOSED' });

    await expect(
      context.service.createRun({
        cycleId: 'cycle-1',
        companyId: 'company-1',
        employeeId: 'employee-1',
        reason: 'Invalid closed payroll change',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('requests reopening only for closed payroll cycles', async () => {
    const context = createPayrollService();
    context.payrollCycleFindUnique.mockResolvedValue({ id: 'cycle-1', companyId: 'company-1', status: 'CLOSED' });

    await expect(
      context.service.requestReopening(
        {
          cycleId: 'cycle-1',
          reason: 'Correct a closed payroll after audit review',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'reopening-1', status: 'REQUESTED' });

    expect(context.payrollReopeningCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cycleId: 'cycle-1',
          requestedBy: 'user-1',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'payroll.reopening.requested',
        entityType: 'PayrollReopening',
        entityId: 'reopening-1',
      }),
    );
  });
});
