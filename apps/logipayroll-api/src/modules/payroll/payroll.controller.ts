import { Body, Controller, ForbiddenException, Get, Headers, Post } from '@nestjs/common';
import { IdentityJwksService, LogiIdentityClaims } from '../auth/identity-jwks.service';
import { CreateContractDto } from './dto/create-contract.dto';
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
