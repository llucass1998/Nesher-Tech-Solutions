const fs = require('fs');
const file = 'apps/logipayroll-worker/src/outbox-dispatcher.ts';
let code = fs.readFileSync(file, 'utf8');

const importReplacement = `import { logipayrollContractCreatedDataSchema, logipayrollLeaveApprovedEventSchema, logipayrollEmployeeUnavailableEventSchema, logipayrollEmployeeAvailableEventSchema } from '@logipeople/event-contracts';`;
code = code.replace(/import \{ logipayrollContractCreatedDataSchema \} from '@logipeople\/event-contracts';/, importReplacement);

const validateReplacement = `
  private validatePayload(event: OutboxEventRow) {
    if (event.eventType === 'logipayroll.contract.created') {
      return logipayrollContractCreatedDataSchema.parse(event.payload);
    }
    if (event.eventType === 'logipayroll.leave.approved') {
      return logipayrollLeaveApprovedEventSchema.shape.data.parse(event.payload);
    }
    if (event.eventType === 'logipayroll.employee.unavailable') {
      return logipayrollEmployeeUnavailableEventSchema.shape.data.parse(event.payload);
    }
    if (event.eventType === 'logipayroll.employee.available') {
      return logipayrollEmployeeAvailableEventSchema.shape.data.parse(event.payload);
    }

    throw new PermanentDispatchError(\`Unsupported LogiPayroll outbox event type: \${event.eventType}\`);
  }
`;

code = code.replace(/private validatePayload\([\s\S]*?\}\n/, validateReplacement.trim() + '\n');

fs.writeFileSync(file, code);
