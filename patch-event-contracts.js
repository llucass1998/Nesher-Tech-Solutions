const fs = require('fs');

let content = fs.readFileSync('packages/event-contracts/src/index.ts', 'utf8');

const newEventSchema = `
export const logipayrollPayrollClosedEventSchema = platformEvent(
  'logipayroll.payroll.closed',
  1,
  z.object({
    payrollRunId: uuidSchema,
    referenceMonth: z.number().int().min(1).max(12),
    referenceYear: z.number().int().min(2000),
    totalEmployees: z.number().int().min(0),
    totalAmountCents: z.number().int(),
  }),
);
`;

content = content.replace('export const platformEventSchemas = [', newEventSchema + '\nexport const platformEventSchemas = [');

content = content.replace(
  'logipayrollEmployeeAvailableEventSchema,\n]',
  'logipayrollEmployeeAvailableEventSchema,\n  logipayrollPayrollClosedEventSchema,\n]'
);

content = content.replace(
  'export type LogipayrollLeaveApprovedEvent = z.infer<typeof logipayrollLeaveApprovedEventSchema>;',
  'export type LogipayrollLeaveApprovedEvent = z.infer<typeof logipayrollLeaveApprovedEventSchema>;\nexport type LogipayrollPayrollClosedEvent = z.infer<typeof logipayrollPayrollClosedEventSchema>;'
);

fs.writeFileSync('packages/event-contracts/src/index.ts', content);
