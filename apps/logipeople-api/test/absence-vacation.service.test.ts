import { BadRequestException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { describe, expect, it, vi } from 'vitest';
import { AbsenceVacationService } from '../src/modules/absence-vacation/absence-vacation.service';

function createAbsenceVacationService() {
  const companyFindUnique = vi.fn().mockResolvedValue({ id: 'company-1' });
  const employeeFindUnique = vi.fn().mockResolvedValue({ id: 'employee-1', companyId: 'company-1' });
  const absenceRequestCreate = vi.fn().mockResolvedValue({
    id: 'absence-1',
    companyId: 'company-1',
    employeeId: 'employee-1',
    type: 'SICK_LEAVE',
    status: 'REQUESTED',
    legalValidationPending: true,
  });
  const vacationPeriodCreate = vi.fn().mockResolvedValue({
    id: 'vacation-1',
    companyId: 'company-1',
    employeeId: 'employee-1',
    status: 'PLANNED',
    legalValidationPending: true,
  });

  const prisma = {
    company: {
      findUnique: companyFindUnique,
    },
    employee: {
      findUnique: employeeFindUnique,
    },
    absenceRequest: {
      findMany: vi.fn(),
      create: absenceRequestCreate,
    },
    vacationPeriod: {
      findMany: vi.fn(),
      create: vacationPeriodCreate,
    },
  };

  const audit = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new AbsenceVacationService(prisma as never, audit as never),
    audit,
    companyFindUnique,
    employeeFindUnique,
    absenceRequestCreate,
    vacationPeriodCreate,
  };
}

const principal: AuthenticatedPrincipal = {
  userId: 'user-1',
  roles: ['HR_ANALYST'],
  scopes: [{ type: 'COMPANY', id: 'company-1' }],
};

describe('AbsenceVacationService', () => {
  it('creates a preliminary absence request with legal validation pending', async () => {
    const context = createAbsenceVacationService();

    await expect(
      context.service.createAbsenceRequest(
        {
          companyId: 'company-1',
          employeeId: 'employee-1',
          type: 'SICK_LEAVE',
          startDate: '2026-08-10',
          endDate: '2026-08-12',
          totalDays: 3,
          notes: 'Atestado pendente de validação',
          reason: 'Employee absence request',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'absence-1', legalValidationPending: true });

    expect(context.companyFindUnique).toHaveBeenCalledWith({ where: { id: 'company-1' } });
    expect(context.employeeFindUnique).toHaveBeenCalledWith({ where: { id: 'employee-1' } });
    expect(context.absenceRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          employeeId: 'employee-1',
          type: 'SICK_LEAVE',
          recordedBy: 'user-1',
          source: 'logipeople-api',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'absence-vacation.absence-request.created',
        entityType: 'AbsenceRequest',
        entityId: 'absence-1',
      }),
    );
  });

  it('creates a preliminary vacation period without calculating legal balances', async () => {
    const context = createAbsenceVacationService();

    await expect(
      context.service.createVacationPeriod(
        {
          companyId: 'company-1',
          employeeId: 'employee-1',
          accrualStart: '2025-08-01',
          accrualEnd: '2026-07-31',
          periodStart: '2026-09-01',
          periodEnd: '2026-09-15',
          days: 15,
          reason: 'Vacation scheduling',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'vacation-1', legalValidationPending: true });

    expect(context.vacationPeriodCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          employeeId: 'employee-1',
          days: 15,
          recordedBy: 'user-1',
          source: 'logipeople-api',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'absence-vacation.vacation-period.created',
        entityType: 'VacationPeriod',
        entityId: 'vacation-1',
      }),
    );
  });

  it('rejects absence requests with inverted dates', async () => {
    const context = createAbsenceVacationService();

    await expect(
      context.service.createAbsenceRequest({
        companyId: 'company-1',
        employeeId: 'employee-1',
        type: 'PERSONAL_LEAVE',
        startDate: '2026-08-12',
        endDate: '2026-08-10',
        totalDays: 3,
        reason: 'Invalid absence request',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects vacation periods with inverted accrual dates', async () => {
    const context = createAbsenceVacationService();

    await expect(
      context.service.createVacationPeriod({
        companyId: 'company-1',
        employeeId: 'employee-1',
        accrualStart: '2026-07-31',
        accrualEnd: '2025-08-01',
        periodStart: '2026-09-01',
        periodEnd: '2026-09-15',
        days: 15,
        reason: 'Invalid vacation accrual period',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects vacation periods with inverted vacation dates', async () => {
    const context = createAbsenceVacationService();

    await expect(
      context.service.createVacationPeriod({
        companyId: 'company-1',
        employeeId: 'employee-1',
        accrualStart: '2025-08-01',
        accrualEnd: '2026-07-31',
        periodStart: '2026-09-15',
        periodEnd: '2026-09-01',
        days: 15,
        reason: 'Invalid vacation period',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
