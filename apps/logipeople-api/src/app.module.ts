import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BenefitsModule } from './modules/benefits/benefits.module';
import { AbsenceVacationModule } from './modules/absence-vacation/absence-vacation.module';
import { HealthModule } from './modules/health/health.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { PayslipsModule } from './modules/payslips/payslips.module';
import { PeopleModule } from './modules/people/people.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { TimeAttendanceModule } from './modules/time-attendance/time-attendance.module';
import { HrCaseModule } from './modules/hr-case/hr-case.module';
import { PerformanceReviewModule } from './modules/performance-review/performance-review.module';
import { TrainingModule } from './modules/training/training.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AnalyticsModule,
    AuditModule,
    AccessControlModule,
    AuthModule,
    BenefitsModule,
    AbsenceVacationModule,
    HealthModule,
    OnboardingModule,
    OrganizationModule,
    PayslipsModule,
    PeopleModule,
    RecruitmentModule,
    TimeAttendanceModule,
    PayrollModule,
    HrCaseModule,
    PerformanceReviewModule,
    TrainingModule,
  ],
})
export class AppModule {}
