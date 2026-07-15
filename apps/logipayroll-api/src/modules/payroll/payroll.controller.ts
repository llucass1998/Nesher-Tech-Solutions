import { Body, Controller, ForbiddenException, Get, Headers, Post, Patch, Param } from '@nestjs/common';
import { IdentityJwksService, LogiIdentityClaims } from '../auth/identity-jwks.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { CreateTimeRecordDto } from './dto/time-record.dto';
import { CreateLeaveRequestDto, ApproveLeaveRequestDto } from './dto/leave-request.dto';
import { PayrollService } from './payroll.service';

@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly payrollService: PayrollService,
    private readonly identityJwks: IdentityJwksService,
  ) {}

  @Get('capabilities')
  capabilities() {
    return this.payrollService.capabilities();
  }

  @Get('contracts')
  async listContracts(@Headers('authorization') authorization?: string) {
    const claims = await this.requirePayrollAccess(authorization, 'logipayroll.contract.read');
    void claims;
    return this.payrollService.listContracts();
  }

  @Post('contracts')
  async createContract(
    @Body() body: CreateContractDto,
    @Headers('authorization') authorization?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const claims = await this.requirePayrollAccess(authorization, 'logipayroll.contract.write');
    return this.payrollService.createContract(body, claims, correlationId);
  }

  @Get('time-records')
  async listTimeRecords(@Headers('authorization') authorization?: string) {
    await this.requirePayrollAccess(authorization, 'logipayroll.time.read');
    return this.payrollService.listTimeRecords();
  }

  @Post('time-records')
  async createTimeRecord(
    @Body() body: CreateTimeRecordDto,
    @Headers('authorization') authorization?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const claims = await this.requirePayrollAccess(authorization, 'logipayroll.time.write');
    return this.payrollService.createTimeRecord(body, claims, correlationId);
  }

  @Get('leaves')
  async listLeaveRequests(@Headers('authorization') authorization?: string) {
    await this.requirePayrollAccess(authorization, 'logipayroll.leave.read');
    return this.payrollService.listLeaveRequests();
  }

  @Post('leaves')
  async createLeaveRequest(
    @Body() body: CreateLeaveRequestDto,
    @Headers('authorization') authorization?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const claims = await this.requirePayrollAccess(authorization, 'logipayroll.leave.write');
    return this.payrollService.createLeaveRequest(body, claims, correlationId);
  }

  @Patch('leaves/:id/approve')
  async approveLeaveRequest(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const claims = await this.requirePayrollAccess(authorization, 'logipayroll.leave.write');
    return this.payrollService.approveLeaveRequest(id, claims, correlationId);
  }

  // Legacy mock endpoint for backward compatibility during testing
  @Post('leaves/approve')
  async approveLeave(
    @Body() body: { employeeId: string; unavailableFrom: string; unavailableUntil: string; category: string },
    @Headers('authorization') authorization?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const claims = await this.requirePayrollAccess(authorization, 'logipayroll.leave.write');
    return this.payrollService.approveLeave(body, claims, correlationId);
  }

  @Post('availability/register')
  async registerAvailability(
    @Body() body: { employeeId: string; availableFrom: string },
    @Headers('authorization') authorization?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const claims = await this.requirePayrollAccess(authorization, 'logipayroll.availability.write');
    return this.payrollService.registerAvailability(body, claims, correlationId);
  }


  @Post('runs/close')
  async closePayrollRun(
    @Body() body: { referenceMonth: number; referenceYear: number },
    @Headers('authorization') authorization?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const claims = await this.requirePayrollAccess(authorization, 'logipayroll.payroll.write');
    return this.payrollService.closePayrollRun(body.referenceMonth, body.referenceYear, claims, correlationId);
  }

  private async requirePayrollAccess(authorization: string | undefined, permission: string): Promise<LogiIdentityClaims> {
    const claims = await this.identityJwks.verifyAuthorizationHeader(authorization);
    const roles = claims.roles ?? [];
    const permissions = claims.permissions ?? [];

    if (roles.some((role) => ['ADMIN', 'PAYROLL_ADMIN'].includes(role)) || permissions.includes(permission)) {
      return claims;
    }

    throw new ForbiddenException({ code: 'ACCESS_DENIED', error: 'Insufficient LogiPayroll permissions.' });
  }
}
