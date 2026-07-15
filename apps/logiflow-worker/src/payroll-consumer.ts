import { randomUUID } from 'node:crypto';
import {
  logipayrollEmployeeAvailableEventSchema,
  logipayrollEmployeeUnavailableEventSchema,
  logipayrollLeaveApprovedEventSchema,
} from '@logipeople/event-contracts';

export interface QueryClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount?: number | null }>;
}

export interface StreamReader {
  xread(...args: string[]): Promise<Array<[string, Array<[string, string[]]>]> | null>;
}

export interface WorkerLogger {
  info(payload: Record<string, unknown>, message: string): void;
  warn(payload: Record<string, unknown>, message: string): void;
}

export interface PayrollConsumerConfig {
  consumerName: string;
  streamName: string;
  batchSize: number;
  blockMs: number;
}

type AvailabilityPayload = {
  employeeId: string;
  unavailableFrom?: string;
  unavailableUntil?: string;
  availableFrom?: string;
  category?: string;
};

export class LogiPayrollAvailabilityConsumer {
  constructor(
    private readonly pool: QueryClient | null,
    private readonly streamReader: StreamReader,
    private readonly logger: WorkerLogger,
    private readonly config: PayrollConsumerConfig,
  ) {}

  async consumeNextBatch() {
    if (!this.pool) {
      this.logger.warn({ operation: 'logipayroll.consume', status: 'skipped', reason: 'DATABASE_URL missing' }, 'LogiPayroll consumer skipped');
      return;
    }

    const lastMessageId = await this.getLastMessageId();
    const response = await this.streamReader.xread(
      'COUNT',
      String(this.config.batchSize),
      'BLOCK',
      String(this.config.blockMs),
      'STREAMS',
      this.config.streamName,
      lastMessageId,
    );

    const messages = response?.[0]?.[1] ?? [];
    for (const [messageId, fields] of messages) {
      await this.processStreamMessage(messageId, fields);
    }
  }

  async processStreamMessage(messageId: string, fields: string[]) {
    const event = parseStreamFields(fields);
    if (!isSupportedPayrollEvent(event.eventType)) {
      await this.saveCheckpoint(messageId);
      return;
    }

    if (!event.payload) {
      throw new Error('LogiPayroll stream event missing payload');
    }

    const payload = parseAvailabilityPayload(event.eventType, event.payload);
    const eventId = event.eventId || messageId;
    const producer = event.producer || 'logipayroll-worker';

    if (!this.pool) return;
    await this.pool.query('BEGIN');
    try {
      const inbox = await this.pool.query<{ id: string }>(
        `
          INSERT INTO "InboxMessage" (id, "eventId", "eventType", producer, "processedAt")
          VALUES ($1, $2, $3, $4, NOW())
          ON CONFLICT ("eventId") DO NOTHING
          RETURNING id
        `,
        [randomUUID(), eventId, event.eventType, producer],
      );

      if ((inbox.rowCount ?? inbox.rows.length) > 0) {
        const status = event.eventType === 'logipayroll.employee.available' ? 'AVAILABLE' : 'UNAVAILABLE';
        const metadata = {
          source: 'logipayroll',
          eventType: event.eventType,
          category: payload.category ?? null,
          unavailableFrom: payload.unavailableFrom ?? null,
          unavailableUntil: payload.unavailableUntil ?? null,
          availableFrom: payload.availableFrom ?? null,
        };
        const updated = await this.pool.query<{ driverId: string | null }>(
          `
            UPDATE "DriverProfile"
            SET status = $2,
                "operationalData" = jsonb_set(COALESCE("operationalData", '{}'::jsonb), '{payrollAvailability}', $3::jsonb, true),
                "updatedAt" = NOW()
            WHERE "employeeId" = $1
            RETURNING "driverId"
          `,
          [payload.employeeId, status, JSON.stringify(metadata)],
        );

        const driverIds = updated.rows.map((row) => row.driverId).filter((driverId): driverId is string => Boolean(driverId));
        if (driverIds.length > 0) {
          await this.pool.query(
            `
              UPDATE "Driver"
              SET status = $2
              WHERE id = ANY($1::text[])
            `,
            [driverIds, status],
          );
        } else {
          this.logger.warn(
            {
              operation: 'logipayroll.availability.unmapped',
              employeeId: payload.employeeId,
              eventId,
            },
            'LogiPayroll availability event has no mapped LogiFlow driver',
          );
        }
      }

      await this.upsertCheckpoint(messageId);
      await this.pool.query('COMMIT');
    } catch (error) {
      await this.pool.query('ROLLBACK');
      throw error;
    }

    this.logger.info(
      {
        operation: 'logipayroll.availability.consumed',
        streamMessageId: messageId,
        eventId,
        employeeId: payload.employeeId,
      },
      'LogiPayroll availability event consumed',
    );
  }

  private async getLastMessageId() {
    if (!this.pool) return '0-0';
    const result = await this.pool.query<{ lastMessageId: string }>(
      `
        SELECT "lastMessageId"
        FROM "ConsumerCheckpoint"
        WHERE "consumerName" = $1
      `,
      [this.config.consumerName],
    );

    return result.rows[0]?.lastMessageId ?? '0-0';
  }

  private async saveCheckpoint(messageId: string) {
    if (!this.pool) return;
    await this.pool.query('BEGIN');
    try {
      await this.upsertCheckpoint(messageId);
      await this.pool.query('COMMIT');
    } catch (error) {
      await this.pool.query('ROLLBACK');
      throw error;
    }
  }

  private async upsertCheckpoint(messageId: string) {
    if (!this.pool) return;
    await this.pool.query(
      `
        INSERT INTO "ConsumerCheckpoint" (id, "consumerName", "streamName", "lastMessageId", "updatedAt")
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT ("consumerName") DO UPDATE
        SET "streamName" = EXCLUDED."streamName",
            "lastMessageId" = EXCLUDED."lastMessageId",
            "updatedAt" = NOW()
      `,
      [randomUUID(), this.config.consumerName, this.config.streamName, messageId],
    );
  }
}

function parseAvailabilityPayload(eventType: string, rawPayload: string): AvailabilityPayload {
  const input = JSON.parse(rawPayload);
  if (eventType === 'logipayroll.leave.approved') {
    return logipayrollLeaveApprovedEventSchema.shape.data.parse(input) as unknown as AvailabilityPayload;
  }
  if (eventType === 'logipayroll.employee.unavailable') {
    return logipayrollEmployeeUnavailableEventSchema.shape.data.parse(input) as unknown as AvailabilityPayload;
  }
  return logipayrollEmployeeAvailableEventSchema.shape.data.parse(input) as unknown as AvailabilityPayload;
}

function isSupportedPayrollEvent(eventType: string | undefined) {
  return (
    eventType === 'logipayroll.leave.approved' ||
    eventType === 'logipayroll.employee.unavailable' ||
    eventType === 'logipayroll.employee.available'
  );
}

function parseStreamFields(fields: string[]) {
  const record: Record<string, string> = {};
  for (let index = 0; index < fields.length; index += 2) {
    record[fields[index] ?? ''] = fields[index + 1] ?? '';
  }
  return record;
}
