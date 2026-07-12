import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AccessControlModule } from './modules/access-control/access-control.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { PeopleModule } from './modules/people/people.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuditModule,
    AccessControlModule,
    AuthModule,
    HealthModule,
    OrganizationModule,
    PeopleModule,
  ],
})
export class AppModule {}
