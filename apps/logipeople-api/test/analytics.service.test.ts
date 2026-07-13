import { describe, expect, it, vi } from 'vitest';
import { AnalyticsService } from '../src/modules/analytics/analytics.service';

function groupByRows(statuses: Record<string, number>) {
  return Object.entries(statuses).map(([status, count]) => ({ status, _count: { _all: count } }));
}

function createAnalyticsService() {
  const employeeGroupBy = vi.fn().mockResolvedValue(groupByRows({ ACTIVE: 8, ON_LEAVE: 1 }));
  const positionGroupBy = vi.fn().mockResolvedValue(groupByRows({ OCCUPIED: 6, VACANT: 2 }));
  const jobApplicationGroupBy = vi.fn().mockResolvedValue(groupByRows({ APPLIED: 4, INTERVIEW: 2 }));
  const onboardingTaskGroupBy = vi.fn().mockResolvedValue(groupByRows({ PENDING: 3, COMPLETED: 5 }));
  const attendancePeriodGroupBy = vi.fn().mockResolvedValue(groupByRows({ OPEN: 2, REVIEWED: 1 }));
  const payrollCycleGroupBy = vi.fn().mockResolvedValue(groupByRows({ DRAFT: 1 }));
  const benefitEnrollmentGroupBy = vi.fn().mockResolvedValue(groupByRows({ REQUESTED: 2 }));
  const absenceRequestGroupBy = vi.fn().mockResolvedValue(groupByRows({ REQUESTED: 1 }));
  const vacationPeriodGroupBy = vi.fn().mockResolvedValue(groupByRows({ PLANNED: 2 }));
  const count = vi.fn().mockResolvedValue(1);

  const prisma = {
    employee: { groupBy: employeeGroupBy },
    position: { groupBy: positionGroupBy },
    jobApplication: { groupBy: jobApplicationGroupBy, count },
    onboardingTask: { groupBy: onboardingTaskGroupBy, count },
    attendancePeriod: { groupBy: attendancePeriodGroupBy, count },
    payrollCycle: { groupBy: payrollCycleGroupBy, count },
    payrollRun: { count },
    payrollItem: { count },
    benefitPlan: { count },
    benefitEnrollment: { groupBy: benefitEnrollmentGroupBy, count },
    absenceRequest: { groupBy: absenceRequestGroupBy, count },
    vacationPeriod: { groupBy: vacationPeriodGroupBy, count },
    jobOpening: { count },
    onboardingPlan: { count },
  };

  return {
    service: new AnalyticsService(prisma as never),
    employeeGroupBy,
    count,
  };
}

describe('AnalyticsService', () => {
  it('returns aggregated metrics without individual sensitive data', async () => {
    const context = createAnalyticsService();

    await expect(context.service.getOverview()).resolves.toMatchObject({
      privacy: {
        aggregationOnly: true,
        excludesSensitiveFields: true,
        legalValidationPending: true,
      },
      people: {
        employeesByStatus: [
          { label: 'ACTIVE', count: 8 },
          { label: 'ON_LEAVE', count: 1 },
        ],
      },
      governance: {
        pendingLegalValidation: {
          total: 12,
        },
      },
    });

    expect(context.employeeGroupBy).toHaveBeenCalledWith({ by: ['status'], _count: { _all: true } });
    expect(context.count).toHaveBeenCalledWith({ where: { legalValidationPending: true } });
  });
});
