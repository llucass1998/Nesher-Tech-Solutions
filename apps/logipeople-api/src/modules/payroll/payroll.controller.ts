import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Roles, ScopeTypes, SensitiveFields } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { FieldAccessGuard } from '../access-control/field-access.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { CreatePayrollItemDto } from './dto/create-payroll-item.dto';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { RequestPayrollReopeningDto } from './dto/request-payroll-reopening.dto';
import { PayrollService } from './payroll.service';

@Controller('payroll')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard, FieldAccessGuard)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('cycles')
  @Roles('PEOPLE_ADMIN', 'PAYROLL_MANAGER', 'PAYROLL_ANALYST', 'AUDITOR')
  listCycles() {
    return this.payrollService.listCycles();
  }

  @Post('cycles')
  @Roles('PEOPLE_ADMIN', 'PAYROLL_MANAGER')
  @ScopeTypes('COMPANY')
  createCycle(@Body() body: CreatePayrollCycleDto, @Req() request: AuthenticatedRequest) {
    return this.payrollService.createCycle(body, request.principal);
  }

  @Get('runs')
  @Roles('PEOPLE_ADMIN', 'PAYROLL_MANAGER', 'PAYROLL_ANALYST', 'AUDITOR')
  @SensitiveFields('salary')
  listRuns() {
    return this.payrollService.listRuns();
  }

  @Post('runs')
  @Roles('PEOPLE_ADMIN', 'PAYROLL_MANAGER')
  @ScopeTypes('COMPANY')
  @SensitiveFields('salary')
  createRun(@Body() body: CreatePayrollRunDto, @Req() request: AuthenticatedRequest) {
    return this.payrollService.createRun(body, request.principal);
  }

  @Get('items')
  @Roles('PEOPLE_ADMIN', 'PAYROLL_MANAGER', 'PAYROLL_ANALYST', 'AUDITOR')
  @SensitiveFields('salary')
  listItems() {
    return this.payrollService.listItems();
  }

  @Post('items')
  @Roles('PEOPLE_ADMIN', 'PAYROLL_MANAGER')
  @SensitiveFields('salary')
  createItem(@Body() body: CreatePayrollItemDto, @Req() request: AuthenticatedRequest) {
    return this.payrollService.createItem(body, request.principal);
  }

  @Post('reopenings')
  @Roles('PEOPLE_ADMIN', 'PAYROLL_MANAGER')
  @SensitiveFields('salary')
  requestReopening(@Body() body: RequestPayrollReopeningDto, @Req() request: AuthenticatedRequest) {
    return this.payrollService.requestReopening(body, request.principal);
  }
}
