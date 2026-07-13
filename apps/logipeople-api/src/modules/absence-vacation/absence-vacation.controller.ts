import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Roles, ScopeTypes, SensitiveFields } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { FieldAccessGuard } from '../access-control/field-access.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AbsenceVacationService } from './absence-vacation.service';
import { CreateAbsenceRequestDto } from './dto/create-absence-request.dto';
import { CreateVacationPeriodDto } from './dto/create-vacation-period.dto';

@Controller('absence-vacation')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard, FieldAccessGuard)
export class AbsenceVacationController {
  constructor(private readonly absenceVacationService: AbsenceVacationService) {}

  @Get('absences')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'AUDITOR')
  @SensitiveFields('documents')
  listAbsenceRequests() {
    return this.absenceVacationService.listAbsenceRequests();
  }

  @Post('absences')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER')
  @ScopeTypes('COMPANY')
  @SensitiveFields('documents')
  createAbsenceRequest(@Body() body: CreateAbsenceRequestDto, @Req() request: AuthenticatedRequest) {
    return this.absenceVacationService.createAbsenceRequest(body, request.principal);
  }

  @Get('vacations')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'PAYROLL_MANAGER', 'PAYROLL_ANALYST', 'AUDITOR')
  @SensitiveFields('documents')
  listVacationPeriods() {
    return this.absenceVacationService.listVacationPeriods();
  }

  @Post('vacations')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST')
  @ScopeTypes('COMPANY')
  @SensitiveFields('documents')
  createVacationPeriod(@Body() body: CreateVacationPeriodDto, @Req() request: AuthenticatedRequest) {
    return this.absenceVacationService.createVacationPeriod(body, request.principal);
  }
}
