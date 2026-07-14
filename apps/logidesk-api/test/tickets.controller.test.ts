import { ForbiddenException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TicketsController } from '../src/modules/tickets/tickets.controller';

function createController() {
  const ticketsService = {
    listDeadLetterEvents: vi.fn().mockResolvedValue([{ id: 'dead-letter-1' }]),
    reprocessDeadLetterEvent: vi.fn().mockResolvedValue({ id: 'outbox-1', status: 'PENDING' }),
  };
  const identityJwks = {
    verifyAuthorizationHeader: vi.fn().mockResolvedValue({
      sub: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      roles: ['ADMIN'],
    }),
  };

  return {
    controller: new TicketsController(ticketsService as never, identityJwks as never),
    ticketsService,
    identityJwks,
  };
}

describe('TicketsController DLQ authorization', () => {
  it('allows dead-letter listing with service token without checking Identity', async () => {
    const context = createController();
    process.env.LOGIDESK_SERVICE_TOKEN = 'service-token';

    await expect(context.controller.listDeadLetterEvents('service-token', undefined, 'corr-1')).resolves.toEqual([
      { id: 'dead-letter-1' },
    ]);

    expect(context.identityJwks.verifyAuthorizationHeader).not.toHaveBeenCalled();
    expect(context.ticketsService.listDeadLetterEvents).toHaveBeenCalledWith({ correlationId: 'corr-1' });
  });

  it('allows dead-letter reprocessing with an ADMIN Identity token', async () => {
    const context = createController();
    process.env.LOGIDESK_SERVICE_TOKEN = 'service-token';

    await expect(context.controller.reprocessDeadLetterEvent('dead-letter-1', {
      reason: 'Retry after outage',
    }, undefined, 'Bearer token')).resolves.toEqual({ id: 'outbox-1', status: 'PENDING' });

    expect(context.identityJwks.verifyAuthorizationHeader).toHaveBeenCalledWith('Bearer token');
    expect(context.ticketsService.reprocessDeadLetterEvent).toHaveBeenCalledWith('dead-letter-1', {
      reason: 'Retry after outage',
    });
  });

  it('rejects dead-letter administration for authenticated users without allowed roles', async () => {
    const context = createController();
    context.identityJwks.verifyAuthorizationHeader.mockResolvedValue({
      sub: 'customer-1',
      email: 'customer@example.com',
      name: 'Customer',
      roles: ['CUSTOMER'],
    });

    await expect(context.controller.listDeadLetterEvents(undefined, 'Bearer token')).rejects.toThrow(ForbiddenException);
    expect(context.ticketsService.listDeadLetterEvents).not.toHaveBeenCalled();
  });
});
