import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TicketsController } from '../src/modules/tickets/tickets.controller';

function createController() {
  const ticketsService = {
    createTicket: vi.fn().mockResolvedValue({ id: 'ticket-1' }),
    createTeam: vi.fn().mockResolvedValue({ id: 'team-1' }),
    updateNotificationPreferences: vi.fn().mockResolvedValue({ userId: 'agent-1' }),
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

afterEach(() => {
  delete process.env.LOGIDESK_REQUIRE_REST_AUTH;
  delete process.env.LOGIDESK_SERVICE_TOKEN;
});

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

describe('TicketsController REST authorization transition', () => {
  it('keeps operational mutations compatible while LOGIDESK_REQUIRE_REST_AUTH is disabled', async () => {
    const context = createController();

    await expect(context.controller.createTicket({
      subject: 'Entrega atrasada',
      description: 'Cliente solicitou apoio.',
      priority: 'MEDIUM',
      correlationId: 'corr-1',
    }, undefined)).resolves.toEqual({ id: 'ticket-1' });

    expect(context.identityJwks.verifyAuthorizationHeader).not.toHaveBeenCalled();
    expect(context.ticketsService.createTicket).toHaveBeenCalled();
  });

  it('requires an Identity bearer token for protected mutations when enabled', async () => {
    const context = createController();
    process.env.LOGIDESK_REQUIRE_REST_AUTH = 'true';
    context.identityJwks.verifyAuthorizationHeader.mockRejectedValue(new UnauthorizedException());

    await expect(context.controller.createTicket({
      subject: 'Entrega atrasada',
      description: 'Cliente solicitou apoio.',
      priority: 'MEDIUM',
      correlationId: 'corr-1',
    }, undefined)).rejects.toThrow(UnauthorizedException);

    expect(context.ticketsService.createTicket).not.toHaveBeenCalled();
  });

  it('rejects protected administrative mutations for roles outside the allowlist', async () => {
    const context = createController();
    process.env.LOGIDESK_REQUIRE_REST_AUTH = 'true';
    context.identityJwks.verifyAuthorizationHeader.mockResolvedValue({
      sub: 'customer-1',
      email: 'customer@example.com',
      name: 'Customer',
      roles: ['CUSTOMER'],
    });

    await expect(context.controller.createTeam({
      name: 'Nivel 2',
      correlationId: 'corr-1',
    }, 'Bearer customer-token')).rejects.toThrow(ForbiddenException);

    expect(context.ticketsService.createTeam).not.toHaveBeenCalled();
  });

  it('allows users to update their own notification preferences when enabled', async () => {
    const context = createController();
    process.env.LOGIDESK_REQUIRE_REST_AUTH = 'true';
    context.identityJwks.verifyAuthorizationHeader.mockResolvedValue({
      sub: 'agent-1',
      email: 'agent@example.com',
      name: 'Agent',
      roles: ['OPERATOR'],
    });

    await expect(context.controller.updateNotificationPreferences('agent-1', {
      inAppEnabled: true,
      correlationId: 'corr-1',
    }, 'Bearer operator-token')).resolves.toEqual({ userId: 'agent-1' });

    expect(context.ticketsService.updateNotificationPreferences).toHaveBeenCalledWith('agent-1', {
      inAppEnabled: true,
      correlationId: 'corr-1',
    });
  });
});
