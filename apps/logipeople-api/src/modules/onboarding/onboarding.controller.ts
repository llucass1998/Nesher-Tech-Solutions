import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Roles, ScopeTypes } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { FieldAccessGuard } from '../access-control/field-access.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOnboardingPlanDto } from './dto/create-onboarding-plan.dto';
import { CreateOnboardingTaskDto } from './dto/create-onboarding-task.dto';
import { OnboardingService } from './onboarding.service';

@Controller('onboarding')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard, FieldAccessGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Get('plans')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'AUDITOR')
  listPlans() {
    return this.onboardingService.listPlans();
  }

  @Post('plans')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST')
  @ScopeTypes('COMPANY')
  createPlan(@Body() body: CreateOnboardingPlanDto, @Req() request: AuthenticatedRequest) {
    return this.onboardingService.createPlan(body, request.principal);
  }

  @Get('tasks')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'EMPLOYEE', 'AUDITOR')
  listTasks() {
    return this.onboardingService.listTasks();
  }

  @Post('tasks')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER')
  createTask(@Body() body: CreateOnboardingTaskDto, @Req() request: AuthenticatedRequest) {
    return this.onboardingService.createTask(body, request.principal);
  }
}
