import { BadRequestException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { describe, expect, it, vi } from 'vitest';
import { TimeAttendanceService } from '../src/modules/time-attendance/time-attendance.service';

function createTimeAttendanceService() {
  const companyFindUnique = vi.fn().mockResolvedValue({ id: 'company-1' });
  const employeeFindUnique = vi.fn().mockResolvedValue({ id: 'employee-1', companyId: 'company-1' });
  const workScheduleCreate = vi.fn().mockResolvedValue({
    id: 'schedule-1',
    companyId: 'company-1',
    employeeId: 'employee-1',
    weeklyMinutes: 2400,
  });
  const timeEntryCreate = vi.fn().mockResolvedValue({
    id: 'entry-1',
    employeeId: 'employee-1',
    kind: 'CLOCK_IN',
    occurredAt: new Date('2026-07-12T08:00:00.000Z'),
  });
  const attendancePeriodCreate = vi.fn().mockResolvedValue({
    id: 'period-1',
    companyId: 'company-1',
    employeeId: 'employee-1',
    periodStart: new Date('2026-07-01T00:00:00.000Z'),
    periodEnd: new Date('2026-07-31T00:00:00.000Z'),
    legalValidationPending: true,
  });

  const prisma = {
    company: {
      findUnique: companyFindUnique,
    },
    employee: {
      findUnique: employeeFindUnique,
    },
    workSchedule: {
      findMany: vi.fn(),
      create: workScheduleCreate,
    },
    timeEntry: {
      findMany: vi.fn(),
      create: timeEntryCreate,
    },
    attendancePeriod: {
      findMany: vi.fn(),
      create: attendancePeriodCreate,
    },
  };

  const audit = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new TimeAttendanceService(prisma as never, audit as never),
    audit,
    companyFindUnique,
    employeeFindUnique,
    workScheduleCreate,
    timeEntryCreate,
    attendancePeriodCreate,
  };
}

const principal: AuthenticatedPrincipal = {
  userId: 'user-1',
  roles: ['TIME_MANAGER'],
  scopes: [{ type: 'COMPANY', id: 'company-1' }],
};

describe('TimeAttendanceService', () => {
  it('creates an effective-dated work schedule with audit trail', async () => {
    const context = createTimeAttendanceService();

    await expect(
      context.service.createWorkSchedule(
        {
          companyId: 'company-1',
          employeeId: 'employee-1',
          name: 'Jornada administrativa',
          weeklyMinutes: 2400,
          workDays: 5,
          effectiveFrom: '2026-07-01',
          reason: 'Initial time attendance setup',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'schedule-1' });

    expect(context.companyFindUnique).toHaveBeenCalledWith({ where: { id: 'company-1' } });
    expect(context.employeeFindUnique).toHaveBeenCalledWith({ where: { id: 'employee-1' } });
    expect(context.workScheduleCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          employeeId: 'employee-1',
          weeklyMinutes: 2400,
          recordedBy: 'user-1',
          source: 'logipeople-api',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'time-attendance.work-schedule.created',
        entityType: 'WorkSchedule',
        entityId: 'schedule-1',
      }),
    );
  });

  it('creates a time entry as pending evidence without payroll calculation', async () => {
    const context = createTimeAttendanceService();

    await expect(
      context.service.createTimeEntry(
        {
          employeeId: 'employee-1',
          kind: 'CLOCK_IN',
          occurredAt: '2026-07-12T08:00:00.000Z',
          source: 'WEB',
          reason: 'Manual clock registration',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'entry-1' });

    expect(context.timeEntryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          employeeId: 'employee-1',
          kind: 'CLOCK_IN',
          source: 'WEB',
          recordedBy: 'user-1',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'time-attendance.time-entry.created',
        entityType: 'TimeEntry',
        entityId: 'entry-1',
      }),
    );
  });

  it('creates an attendance period with legal validation pending', async () => {
    const context = createTimeAttendanceService();

    await expect(
      context.service.createAttendancePeriod(
        {
          companyId: 'company-1',
          employeeId: 'employee-1',
          periodStart: '2026-07-01',
          periodEnd: '2026-07-31',
          plannedMinutes: 10560,
          workedMinutes: 9600,
          absenceMinutes: 0,
          extraMinutes: 0,
          reason: 'Preliminary monthly attendance consolidation',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'period-1' });

    expect(context.attendancePeriodCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          plannedMinutes: 10560,
          workedMinutes: 9600,
          recordedBy: 'user-1',
          source: 'logipeople-api',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'time-attendance.attendance-period.created',
        entityType: 'AttendancePeriod',
        entityId: 'period-1',
      }),
    );
  });

  it('rejects attendance periods with inverted dates', async () => {
    const context = createTimeAttendanceService();

    await expect(
      context.service.createAttendancePeriod({
        companyId: 'company-1',
        employeeId: 'employee-1',
        periodStart: '2026-07-31',
        periodEnd: '2026-07-01',
        plannedMinutes: 0,
        workedMinutes: 0,
        absenceMinutes: 0,
        extraMinutes: 0,
        reason: 'Invalid period',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
