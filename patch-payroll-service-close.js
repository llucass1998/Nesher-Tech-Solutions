const fs = require('fs');

let content = fs.readFileSync('apps/logipayroll-api/src/modules/payroll/payroll.service.ts', 'utf8');

const closePayrollRunCode = `
  async closePayrollRun(referenceMonth: number, referenceYear: number, claims: LogiIdentityClaims, correlationId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Create or update the run
      const run = await tx.payrollRun.upsert({
        where: { referenceMonth_referenceYear: { referenceMonth, referenceYear } },
        update: { status: 'CLOSED' },
        create: { referenceMonth, referenceYear, status: 'CLOSED' },
      });

      // Find active contracts
      const activeContracts = await tx.contract.findMany({ where: { status: 'ACTIVE' } });
      let totalAmountCents = 0;

      for (const contract of activeContracts) {
        const amount = 300000; // 3000.00 BRL
        totalAmountCents += amount;

        await tx.payrollItem.create({
          data: {
            payrollRunId: run.id,
            employeeId: contract.employeeId,
            code: 'BASE_SALARY',
            description: 'Salario Base',
            kind: 'EARNING',
            amountCents: amount,
          },
        });
      }

      const { logipayrollPayrollClosedEventSchema } = require('@logipeople/event-contracts');
      
      const eventPayload = logipayrollPayrollClosedEventSchema.shape.data.parse({
        payrollRunId: run.id,
        referenceMonth: run.referenceMonth,
        referenceYear: run.referenceYear,
        totalEmployees: activeContracts.length,
        totalAmountCents: totalAmountCents,
      });

      await tx.outboxEvent.create({
        data: {
          eventType: 'logipayroll.payroll.closed',
          eventVersion: 1,
          correlationId: correlationId ?? null,
          causationId: claims.sessionId ?? null,
          payload: eventPayload as unknown as Prisma.InputJsonValue,
        },
      });

      return { success: true, runId: run.id, totalEmployees: activeContracts.length };
    });
  }
`;

content = content.replace('private publicContract', closePayrollRunCode + '\n  private publicContract');
fs.writeFileSync('apps/logipayroll-api/src/modules/payroll/payroll.service.ts', content);
