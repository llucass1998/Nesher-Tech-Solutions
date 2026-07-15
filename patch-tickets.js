const fs = require('fs');
const file = 'apps/logidesk-api/src/modules/tickets/tickets.service.ts';
let code = fs.readFileSync(file, 'utf8');

const newMethod = `
  async updateTicketStatusFromHrCase(hrCaseId: string, input: { newStatus: string, previousStatus: string }, idempotencyKey?: string, correlationId?: string) {
    if (!correlationId) {
      throw new BadRequestException({ error: 'Missing x-correlation-id to identify the ticket.' });
    }

    if (idempotencyKey) {
      const existing = await this.prisma.idempotencyRecord.findUnique({ where: { key: idempotencyKey } });
      if (existing) {
        if (existing.responseRef) return JSON.parse(existing.responseRef);
        return { acknowledged: true };
      }
    }

    const ticket = await this.getTicket(correlationId);
    if (!ticket) {
      throw new NotFoundException({ error: 'Ticket not found by correlationId.' });
    }

    // Also link externalId if it wasn't linked yet
    if (!ticket.externalId) {
      await this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { externalSystem: 'LOGIPEOPLE', externalId: hrCaseId },
      });
    }

    let targetStatus: TicketStatus | null = null;
    switch (input.newStatus) {
      case 'OPEN': targetStatus = 'OPEN'; break;
      case 'IN_REVIEW': targetStatus = 'IN_PROGRESS'; break;
      case 'WAITING_EMPLOYEE': targetStatus = 'WAITING_CUSTOMER'; break;
      case 'WAITING_MANAGER': targetStatus = 'WAITING_INTERNAL'; break;
      case 'COMPLETED': targetStatus = 'RESOLVED'; break;
      case 'CANCELED': targetStatus = 'CANCELED'; break;
    }

    if (!targetStatus) {
      throw new BadRequestException({ error: 'Unmapped HR Case status' });
    }

    let result = ticket;
    if (ticket.status !== targetStatus) {
      result = await this.changeStatus(ticket.id, { status: targetStatus });
    }

    if (idempotencyKey) {
      await this.prisma.idempotencyRecord.create({
        data: {
          key: idempotencyKey,
          operation: 'updateTicketStatusFromHrCase',
          requestHash: JSON.stringify(input),
          responseRef: JSON.stringify(result),
          correlationId: correlationId,
        },
      });
    }

    return result;
  }
`;

code = code.replace(/async changeStatus\(id: string, input: ChangeTicketStatusDto\) \{/, newMethod + "\n  async changeStatus(id: string, input: ChangeTicketStatusDto) {");
fs.writeFileSync(file, code);
