import { describe, expect, it, vi } from 'vitest';
import { LogiPayrollOutboxDispatcher, OutboxEventRow, QueryClient } from './outbox-dispatcher';

const validEvent: OutboxEventRow = {
  id: '11111111-1111-4111-8111-111111111111',
  eventType: 'logipayroll.contract.created',
  eventVersion: 1,
  attempts: 1,
  correlationId: '22222222-2222-4222-8222-222222222222',
  causationId: '33333333-3333-4333-8333-333333333333',
  payload: {
    contractId: '44444444-4444-4444-8444-444444444444',
    employeeId: '55555555-5555-4555-8555-555555555555',
    identityUserId: '66666666-6666-4666-8666-666666666666',
    logiPeopleId: '77777777-7777-4777-8777-777777777777',
    startsAt: '2026-07-14T00:00:00.000Z',
    endsAt: null,
    status: 'ACTIVE',
  },
};

function createDispatcher(input?: { xaddFails?: boolean; maxAttempts?: number }) {
  const queries: Array<{ sql: string; params?: unknown[] }> = [];
  const pool: QueryClient = {
    query: vi.fn(async (sql: string, params?: unknown[]) => {
      queries.push(params === undefined ? { sql } : { sql, params });
      return { rows: [], rowCount: 1 };
    }),
  };
  const streamPublisher = {
    xadd: input?.xaddFails ? vi.fn().mockRejectedValue(new Error('redis down')) : vi.fn().mockResolvedValue('stream-id'),
  };
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const dispatcher = new LogiPayrollOutboxDispatcher(pool as never, streamPublisher, logger, {
    maxAttempts: input?.maxAttempts ?? 5,
    retryBaseDelaySeconds: 30,
    retryMaxDelaySeconds: 900,
    eventStreamName: 'logipayroll.events',
    eventStreamMaxLen: 10000,
  });

  return { dispatcher, pool, queries, streamPublisher, logger };
}

describe('LogiPayrollOutboxDispatcher', () => {
  it('publishes a valid contract event and marks it processed', async () => {
    const context = createDispatcher();

    await context.dispatcher.dispatchOutboxEvent(validEvent);

    expect(context.streamPublisher.xadd).toHaveBeenCalledWith(
      'logipayroll.events',
      'MAXLEN',
      '~',
      '10000',
      '*',
      'eventId',
      validEvent.id,
      'eventType',
      'logipayroll.contract.created',
      'eventVersion',
      '1',
      'correlationId',
      validEvent.correlationId,
      'causationId',
      validEvent.causationId,
      'producer',
      'logipayroll-worker',
      'status',
      'published',
      'payload',
      JSON.stringify(validEvent.payload),
    );
    expect(context.queries.some((query) => query.sql.includes("SET status = 'PROCESSED'"))).toBe(true);
  });

  it('marks transient Redis failures as FAILED for retry', async () => {
    const context = createDispatcher({ xaddFails: true });

    await context.dispatcher.dispatchOutboxEvent(validEvent);

    expect(context.queries.some((query) => query.params?.includes('FAILED'))).toBe(true);
    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "DeadLetterEvent"'))).toBe(false);
  });

  it('moves unsupported events to dead letter', async () => {
    const context = createDispatcher();

    await context.dispatcher.dispatchOutboxEvent({
      ...validEvent,
      eventType: 'logipayroll.salary.published',
    });

    expect(context.streamPublisher.xadd).not.toHaveBeenCalled();
    expect(context.queries.some((query) => query.params?.includes('DEAD_LETTER'))).toBe(true);
    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "DeadLetterEvent"'))).toBe(true);
  });
});
