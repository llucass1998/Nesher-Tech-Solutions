import { describe, expect, it, vi } from 'vitest';
import { LogiPeopleOutboxDispatcher, OutboxEventRow, QueryClient } from './outbox-dispatcher.js';

const validEvent: OutboxEventRow = {
  id: '11111111-1111-4111-8111-111111111111',
  eventType: 'logipeople.employee.hired',
  eventVersion: 1,
  attempts: 1,
  correlationId: '22222222-2222-4222-8222-222222222222',
  causationId: '33333333-3333-4333-8333-333333333333',
  payload: {
    employeeId: '44444444-4444-4444-8444-444444444444',
    personId: '55555555-5555-4555-8555-555555555555',
    startDate: '2026-07-14',
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
  const dispatcher = new LogiPeopleOutboxDispatcher(pool as never, streamPublisher, logger, {
    maxAttempts: input?.maxAttempts ?? 5,
    retryBaseDelaySeconds: 30,
    retryMaxDelaySeconds: 900,
    eventStreamName: 'logipeople.events',
    eventStreamMaxLen: 10000,
  });

  return { dispatcher, queries, streamPublisher };
}

describe('LogiPeopleOutboxDispatcher', () => {
  it('publishes a valid employee hired event and marks it processed', async () => {
    const context = createDispatcher();

    await context.dispatcher.dispatchOutboxEvent(validEvent);

    expect(context.streamPublisher.xadd).toHaveBeenCalledWith(
      'logipeople.events',
      'MAXLEN',
      '~',
      '10000',
      '*',
      'eventId',
      validEvent.id,
      'eventType',
      'logipeople.employee.hired',
      'eventVersion',
      '1',
      'correlationId',
      validEvent.correlationId,
      'causationId',
      validEvent.causationId,
      'producer',
      'logipeople-worker',
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
      eventType: 'logipeople.salary.changed',
    });

    expect(context.streamPublisher.xadd).not.toHaveBeenCalled();
    expect(context.queries.some((query) => query.params?.includes('DEAD_LETTER'))).toBe(true);
    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "DeadLetterEvent"'))).toBe(true);
  });
});
