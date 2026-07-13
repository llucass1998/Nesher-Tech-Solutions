import { Controller, Get, UseGuards } from '@nestjs/common';
import { Roles } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { FieldAccessGuard } from '../access-control/field-access.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard, FieldAccessGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'PAYROLL_MANAGER', 'BENEFITS_ANALYST', 'AUDITOR', 'DPO')
  getOverview() {
    return this.analyticsService.getOverview();
  }
}
