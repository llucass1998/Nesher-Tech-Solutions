import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview() {
    const [
      employeesByStatus,
      positionsByStatus,
      recruitmentByStatus,
      onboardingByStatus,
      timeByStatus,
      payrollByStatus,
      benefitsByStatus,
      absenceByStatus,
      vacationByStatus,
      pendingLegalValidation,
    ] = await Promise.all([
      this.prisma.employee.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.position.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.jobApplication.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.onboardingTask.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.attendancePeriod.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.payrollCycle.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.benefitEnrollment.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.absenceRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.vacationPeriod.groupBy({ by: ['status'], _count: { _all: true } }),
      this.countPendingLegalValidation(),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      privacy: {
        aggregationOnly: true,
        excludesSensitiveFields: true,
        legalValidationPending: true,
      },
      people: {
        employeesByStatus: this.toMetricRows(employeesByStatus),
        positionsByStatus: this.toMetricRows(positionsByStatus),
      },
      hiring: {
        applicationsByStatus: this.toMetricRows(recruitmentByStatus),
        onboardingTasksByStatus: this.toMetricRows(onboardingByStatus),
      },
      operations: {
        attendancePeriodsByStatus: this.toMetricRows(timeByStatus),
        absenceRequestsByStatus: this.toMetricRows(absenceByStatus),
        vacationPeriodsByStatus: this.toMetricRows(vacationByStatus),
      },
      administration: {
        payrollCyclesByStatus: this.toMetricRows(payrollByStatus),
        benefitEnrollmentsByStatus: this.toMetricRows(benefitsByStatus),
      },
      governance: {
        pendingLegalValidation,
      },
    };
  }

  private async countPendingLegalValidation() {
    const [attendancePeriods, payrollCycles, payrollRuns, payrollItems, benefitPlans, benefitEnrollments, absenceRequests, vacationPeriods, jobOpenings, jobApplications, onboardingPlans, onboardingTasks] = await Promise.all([
      this.prisma.attendancePeriod.count({ where: { legalValidationPending: true } }),
      this.prisma.payrollCycle.count({ where: { legalValidationPending: true } }),
      this.prisma.payrollRun.count({ where: { legalValidationPending: true } }),
      this.prisma.payrollItem.count({ where: { legalValidationPending: true } }),
      this.prisma.benefitPlan.count({ where: { legalValidationPending: true } }),
      this.prisma.benefitEnrollment.count({ where: { legalValidationPending: true } }),
      this.prisma.absenceRequest.count({ where: { legalValidationPending: true } }),
      this.prisma.vacationPeriod.count({ where: { legalValidationPending: true } }),
      this.prisma.jobOpening.count({ where: { legalValidationPending: true } }),
      this.prisma.jobApplication.count({ where: { legalValidationPending: true } }),
      this.prisma.onboardingPlan.count({ where: { legalValidationPending: true } }),
      this.prisma.onboardingTask.count({ where: { legalValidationPending: true } }),
    ]);

    return {
      attendancePeriods,
      payrollCycles,
      payrollRuns,
      payrollItems,
      benefitPlans,
      benefitEnrollments,
      absenceRequests,
      vacationPeriods,
      jobOpenings,
      jobApplications,
      onboardingPlans,
      onboardingTasks,
      total:
        attendancePeriods +
        payrollCycles +
        payrollRuns +
        payrollItems +
        benefitPlans +
        benefitEnrollments +
        absenceRequests +
        vacationPeriods +
        jobOpenings +
        jobApplications +
        onboardingPlans +
        onboardingTasks,
    };
  }

  private toMetricRows(rows: Array<{ _count: { _all: number } } & Record<string, unknown>>) {
    return rows.map((row) => {
      const [key] = Object.keys(row).filter((field) => field !== '_count');
      const value = key ? row[key] : 'UNKNOWN';

      return {
        label: String(value),
        count: row._count._all,
      };
    });
  }
}
