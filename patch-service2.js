const fs = require('fs');
const file = 'apps/logidesk-api/src/modules/tickets/tickets.service.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/BadRequestException/g, 'UnprocessableEntityException');

code = code.replace(/let result = ticket;\s+if \(ticket.status !== targetStatus\) {\s+result = await this.changeStatus\(ticket.id, \{ status: targetStatus \}\);\s+}/, 
`let result: any = ticket;
    if (ticket.status !== targetStatus) {
      await this.changeStatus(ticket.id, { status: targetStatus, correlationId: correlationId ?? 'system-update' });
      result = await this.getTicket(ticket.id);
    }`);

fs.writeFileSync(file, code);
