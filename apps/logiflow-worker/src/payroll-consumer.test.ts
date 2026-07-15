import { describe, expect, it, vi } from 'vitest';
import { LogiPayrollAvailabilityConsumer, QueryClient } from './payroll-consumer.js';

const leaveApprovedFields = [
  'eventId',
  '11111111-1111-4111-8111-111111111111',
  'eventType',
  'logipayroll.leave.approved',
  'producer',
  'logipayroll-worker',
  'payload',
  JSON.stringify({
    employeeId: '22222222-2222-4222-8222-222222222222',
    unavailableFrom: '2026-07-20T00:00:00.000Z',
    unavailableUntil: '2026-08-01T00:00:00.000Z',
    category: 'VACATION',
  }),
];

function createConsumer(input?: { duplicateInbox?: boolean; mappedDriver?: boolean }) {
  const queries: Array<{ sql: string; params?: unknown[] }> = [];
  const pool: QueryClient = {
    query: async <T = unknown>(sql: string, params?: unknown[]) => {
      queries.push(params === undefined ? { sql } : { sql, params });
      if (sql.includes('INSERT INTO "InboxMessage"')) {
        return { rows: (input?.duplicateInbox ? [] : [{ id: 'inbox-1' }]) as T[], rowCount: input?.duplicateInbox ? 0 : 1 };
      }
      if (sql.includes('UPDATE "DriverProfile"')) {
        return {
          rows: (input?.mappedDriver ? [{ driverId: '33333333-3333-4333-8333-333333333333' }] : []) as T[],
          rowCount: input?.mappedDriver ? 1 : 0,
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
  };
  const consumer = new LogiPayrollAvailabilityConsumer(pool, streamReader, logger, {
    consumerName: 'logiflow.logipayroll.availability',
    streamName: 'logipayroll.events',
    batchSize: 10,
    blockMs: 100,
  });

  return { consumer, queries, logger };
}

describe('LogiPayrollAvailabilityConsumer', () => {
  it('marks a mapped driver unavailable when leave is approved', async () => {
    const context = createConsumer({ mappedDriver: true });

    await context.consumer.processStreamMessage('1-0', leaveApprovedFields);

    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "InboxMessage"'))).toBe(true);
    expect(context.queries.some((query) => query.sql.includes('UPDATE "DriverProfile"'))).toBe(true);
    expect(context.queries.some((query) => query.sql.includes('UPDATE "Driver"'))).toBe(true);
    expect(context.queries.flatMap((query) => query.params ?? [])).not.toContain('salary');
    expect(context.queries.flatMap((query) => query.params ?? [])).not.toContain('medical');
  });

  it('does not update driver status for duplicate events', async () => {
    const context = createConsumer({ duplicateInbox: true, mappedDriver: true });

    await context.consumer.processStreamMessage('1-0', leaveApprovedFields);

    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "InboxMessage"'))).toBe(true);
    expect(context.queries.some((query) => query.sql.includes('UPDATE "DriverProfile"'))).toBe(false);
    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "ConsumerCheckpoint"'))).toBe(true);
  });

  it('records inbox and checkpoint when the employee is not mapped to a driver', async () => {
    const context = createConsumer();

    await context.consumer.processStreamMessage('1-0', leaveApprovedFields);

    expect(context.queries.some((query) => query.sql.includes('UPDATE "DriverProfile"'))).toBe(true);
    expect(context.queries.some((query) => query.sql.includes('UPDATE "Driver"'))).toBe(false);
    expect(context.queries.some((query) => query.sql.includes('INSERT INTO "ConsumerCheckpoint"'))).toBe(true);
    expect(context.logger.warn).toHaveBeenCalled();
  });
});
