const fs = require('fs');
let content = fs.readFileSync('apps/logipayroll-api/src/modules/payroll/payroll.controller.ts', 'utf8');

const closeEndpoint = `
  @Post('runs/close')
  async closePayrollRun(
    @Body() body: { referenceMonth: number; referenceYear: number },
    @Headers('authorization') authorization?: string,
    @Headers('x-correlation-id') correlationId?: string,
  ) {
    const claims = await this.requirePayrollAccess(authorization, 'logipayroll.payroll.write');
    return this.payrollService.closePayrollRun(body.referenceMonth, body.referenceYear, claims, correlationId);
  }

  private async requirePayrollAccess`;

content = content.replace('  private async requirePayrollAccess', closeEndpoint);
fs.writeFileSync('apps/logipayroll-api/src/modules/payroll/payroll.controller.ts', content);
