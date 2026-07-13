import { ConflictException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TicketsService } from '../src/modules/tickets/tickets.service';

function createTicketsService() {
  const ticketCount = vi.fn().mockResolvedValue(0);
  const ticketFindUnique = vi.fn().mockResolvedValue(null);
  const ticketCreate = vi.fn().mockResolvedValue({
    id: 'ticket-1',
    number: 'LD-000001',
    status: 'OPEN',
    priority: 'HIGH',
    correlationId: '11111111-1111-4111-8111-111111111111',
  });
  const idempotencyFindUnique = vi.fn().mockResolvedValue(null);
  const idempotencyUpsert = vi.fn().mockResolvedValue({});
  const outboxCreate = vi.fn().mockResolvedValue({});
  const auditCreate = vi.fn().mockResolvedValue({});

  const tx = {
    ticket: { create: ticketCreate },
    idempotencyRecord: { upsert: idempotencyUpsert },
    outboxEvent: { create: outboxCreate },
    auditLog: { create: auditCreate },
  };

  const prisma = {
    ticket: {
      count: ticketCount,
      findMany: vi.fn(),
      findUnique: ticketFindUnique,
      update: vi.fn(),
    },
    idempotencyRecord: {
      findUnique: idempotencyFindUnique,
    },
    outboxEvent: {
      create: vi.fn(),
    },
    ticketMessage: {
      create: vi.fn(),
    },
    ticketNote: {
      create: vi.fn(),
    },
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  return {
    service: new TicketsService(prisma as never),
    prisma,
    ticketCount,
    ticketFindUnique,
    ticketCreate,
    idempotencyFindUnique,
    idempotencyUpsert,
    outboxCreate,
    auditCreate,
  };
}

const input = {
  deliveryId: '22222222-2222-4222-8222-222222222222',
  occurrenceId: '33333333-3333-4333-8333-333333333333',
  subject: 'Entrega com atraso',
  description: 'Motorista reportou bloqueio na doca.',
  priority: 'HIGH' as const,
  requesterEmail: 'cliente@empresa.com',
  correlationId: '11111111-1111-4111-8111-111111111111',
};

describe('TicketsService', () => {
  it('creates a LogiDesk ticket from a LogiFlow occurrence with idempotency and outbox event', async () => {
    const context = createTicketsService();

    await expect(context.service.createFromLogiflow(input, 'idem-1')).resolves.toMatchObject({
      id: 'ticket-1',
      number: 'LD-000001',
      status: 'OPEN',
    });

    expect(context.ticketCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'LOGIFLOW',
          externalSystem: 'LOGIFLOW',
          externalId: input.occurrenceId,
          deliveryId: input.deliveryId,
          occurrenceId: input.occurrenceId,
          idempotencyKey: 'idem-1',
        }),
      }),
    );
    expect(context.idempotencyUpsert).toHaveBeenCalled();
    expect(context.outboxCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'ticket.created',
          correlationId: input.correlationId,
        }),
      }),
    );
    expect(context.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ticket.created_from_logiflow',
          entityType: 'Ticket',
        }),
      }),
    );
  });

  it('returns an existing ticket when the same idempotency key is replayed with the same payload', async () => {
    const context = createTicketsService();
    context.idempotencyFindUnique.mockResolvedValue({
      key: 'idem-1',
      requestHash: 'same-hash',
      responseRef: 'ticket-existing',
    });
    vi.spyOn(context.service as unknown as { hash: (value: unknown) => string }, 'hash').mockReturnValue('same-hash');
    context.ticketFindUnique.mockResolvedValue({ id: 'ticket-existing', number: 'LD-000001' });

    await expect(context.service.createFromLogiflow(input, 'idem-1')).resolves.toMatchObject({ id: 'ticket-existing' });
    expect(context.ticketCreate).not.toHaveBeenCalled();
  });

  it('rejects idempotency key reuse with a different payload', async () => {
    const context = createTicketsService();
    context.idempotencyFindUnique.mockResolvedValue({
      key: 'idem-1',
      requestHash: 'previous-hash',
      responseRef: 'ticket-existing',
    });

    await expect(context.service.createFromLogiflow(input, 'idem-1')).rejects.toThrow(ConflictException);
  });
});
