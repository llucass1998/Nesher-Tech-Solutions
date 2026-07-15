const fs = require('fs');
const file = 'apps/logipayroll-api/src/modules/payroll/payroll.controller.ts';
let code = fs.readFileSync(file, 'utf8');

const importReplacement = `import { Body, Controller, ForbiddenException, Get, Headers, Post } from '@nestjs/common';
import { IdentityJwksService, LogiIdentityClaims } from '../auth/identity-jwks.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { PayrollService } from './payroll.service';`;

const leaveEndpoints = `
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
`;

code = code.replace(/private async requirePayrollAccess/, leaveEndpoints + '\n  private async requirePayrollAccess');

fs.writeFileSync(file, code);
