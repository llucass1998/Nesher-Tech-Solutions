import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { BenefitsModule } from './modules/benefits/benefits.module';
import { AbsenceVacationModule } from './modules/absence-vacation/absence-vacation.module';
import { HealthModule } from './modules/health/health.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { PeopleModule } from './modules/people/people.module';
import { RecruitmentModule } from './modules/recruitment/recruitment.module';
import { TimeAttendanceModule } from './modules/time-attendance/time-attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AccessControlModule,
    AuthModule,
    BenefitsModule,
    AbsenceVacationModule,
    HealthModule,
    OrganizationModule,
    PeopleModule,
    RecruitmentModule,
    TimeAttendanceModule,
    PayrollModule,
  ],
})
export class AppModule {}
