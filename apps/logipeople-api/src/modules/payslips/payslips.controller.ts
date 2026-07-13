import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Roles, ScopeTypes, SensitiveFields } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { FieldAccessGuard } from '../access-control/field-access.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePayslipDto } from './dto/create-payslip.dto';
import { PayslipsService } from './payslips.service';

@Controller('payslips')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard, FieldAccessGuard)
export class PayslipsController {
  constructor(private readonly payslipsService: PayslipsService) {}

  @Get()
  @Roles('PEOPLE_ADMIN', 'PAYROLL_MANAGER', 'PAYROLL_ANALYST', 'AUDITOR')
  @SensitiveFields('salary')
  listPayslips() {
    return this.payslipsService.listPayslips();
  }

  @Post()
  @Roles('PEOPLE_ADMIN', 'PAYROLL_MANAGER')
  @ScopeTypes('COMPANY')
  @SensitiveFields('salary')
  createPayslip(@Body() body: CreatePayslipDto, @Req() request: AuthenticatedRequest) {
    return this.payslipsService.createPayslip(body, request.principal);
  }

  @Get('lines')
  @Roles('PEOPLE_ADMIN', 'PAYROLL_MANAGER', 'PAYROLL_ANALYST', 'AUDITOR')
  @SensitiveFields('salary')
  listLines() {
    return this.payslipsService.listLines();
  }
}
