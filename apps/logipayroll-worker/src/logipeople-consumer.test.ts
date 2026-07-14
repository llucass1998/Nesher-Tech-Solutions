import { describe, expect, it, vi } from 'vitest';
import { LogiPeopleEmployeeHiredConsumer } from './logipeople-consumer';
import { QueryClient } from './outbox-dispatcher';

const fields = [
  'eventId',
  '11111111-1111-4111-8111-111111111111',
  'eventType',
  'logipeople.employee.hired',
  'eventVersion',
  '1',
  'producer',
  'logipeople-worker',
  'payload',
  JSON.stringify({
    employeeId: '22222222-2222-4222-8222-222222222222',
    personId: '33333333-3333-4333-8333-333333333333',
    startDate: '2026-07-14',
  }),
];

function createConsumer(input?: { duplicateInbox?: boolean }) {
  const queries: Array<{ sql: string; params?: unknown[] }> = [];
  const pool: QueryClient = {
    query: async <T = unknown>(sql: string, params?: unknown[]) => {
      queries.push(params === undefined ? { sql } : { sql, params });
      if (sql.includes('INSERT INTO "InboxMessage"')) {
        return {
          rows: (input?.duplicateInbox ? [] : [{ id: 'inbox-1' }]) as T[],
          rowCount: input?.duplicateInbox ? 0 : 1,
        };
      }
      return { rows: [] as T[], rowCount: 1 };
    },
  };
  const streamReader = {
    xread: vi.fn().mockResolvedValue(null),
  };
  const logger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };
  const consumer = new LogiPeopleEmployeeHiredConsumer(pool as never, streamReader, logger, {
    consumerName: 'logipayroll.logipeople.employee_hired',
    streamName: 'logipeople.events',
    batchSize: 10,
    blockMs: 100,
  });

  return { consumer, queries, streamReader };
}

describe('LogiPeopleEmployeeHiredConsumer', () => {
  it('creates an inbox record and an employee reference for a valid hired event', async () => {
    const context = createConsumer();

    await context.consumer.processStreamMessage('1-0', fields);

    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "InboxMessage"'))).toBe(true);
    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "PayrollEmployeeReference"'))).toBe(true);
    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "ConsumerCheckpoint"'))).toBe(true);
    expect(context.queries.flatMap((query) => query.params ?? [])).not.toContain('salary');
    expect(context.queries.flatMap((query) => query.params ?? [])).not.toContain('document');
  });

  it('does not recreate the employee reference when the event was already processed', async () => {
    const context = createConsumer({ duplicateInbox: true });

    await context.consumer.processStreamMessage('1-0', fields);

    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "InboxMessage"'))).toBe(true);
    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "PayrollEmployeeReference"'))).toBe(false);
    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "ConsumerCheckpoint"'))).toBe(true);
  });

  it('ignores unsupported event types and advances the checkpoint', async () => {
    const context = createConsumer();

    await context.consumer.processStreamMessage('1-0', [
      ...fields.slice(0, 3),
      'logipeople.employee.updated',
      ...fields.slice(4),
    ]);

    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "InboxMessage"'))).toBe(false);
    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "ConsumerCheckpoint"'))).toBe(true);
  });
});
