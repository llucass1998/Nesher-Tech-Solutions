import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Roles, ScopeTypes, SensitiveFields } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { FieldAccessGuard } from '../access-control/field-access.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BenefitsService } from './benefits.service';
import { CreateBenefitEnrollmentDto } from './dto/create-benefit-enrollment.dto';
import { CreateBenefitPlanDto } from './dto/create-benefit-plan.dto';

@Controller('benefits')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard, FieldAccessGuard)
export class BenefitsController {
  constructor(private readonly benefitsService: BenefitsService) {}

  @Get('plans')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'BENEFITS_ANALYST', 'AUDITOR')
  listPlans() {
    return this.benefitsService.listPlans();
  }

  @Post('plans')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'BENEFITS_ANALYST')
  @ScopeTypes('COMPANY')
  @SensitiveFields('dependents')
  createPlan(@Body() body: CreateBenefitPlanDto, @Req() request: AuthenticatedRequest) {
    return this.benefitsService.createPlan(body, request.principal);
  }

  @Get('enrollments')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'BENEFITS_ANALYST', 'AUDITOR')
  @SensitiveFields('dependents')
  listEnrollments() {
    return this.benefitsService.listEnrollments();
  }

  @Post('enrollments')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'BENEFITS_ANALYST')
  @ScopeTypes('COMPANY')
  @SensitiveFields('dependents')
  createEnrollment(@Body() body: CreateBenefitEnrollmentDto, @Req() request: AuthenticatedRequest) {
    return this.benefitsService.createEnrollment(body, request.principal);
  }
}
