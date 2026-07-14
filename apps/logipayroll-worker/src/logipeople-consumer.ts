import { randomUUID } from 'node:crypto';
import { logipeopleEmployeeHiredEventSchema } from '@logipeople/event-contracts';
import { DatabasePool, WorkerLogger } from './outbox-dispatcher';

interface EmployeeHiredPayload {
  employeeId: string;
  personId: string;
  startDate: string;
}

export interface StreamReader {
  xread(...args: string[]): Promise<Array<[string, Array<[string, string[]]>]> | null>;
}

export interface ConsumerConfig {
  consumerName: string;
  streamName: string;
  batchSize: number;
  blockMs: number;
}

export class LogiPeopleEmployeeHiredConsumer {
  constructor(
    private readonly pool: DatabasePool | null,
    private readonly streamReader: StreamReader,
    private readonly logger: WorkerLogger,
    private readonly config: ConsumerConfig,
  ) {}

  async consumeNextBatch() {
    if (!this.pool) {
      this.logger.warn({ operation: 'logipeople.consume', status: 'skipped', reason: 'LOGIPAYROLL_DATABASE_URL missing' }, 'LogiPeople consumer skipped');
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

    if (event.eventType !== 'logipeople.employee.hired') {
      await this.saveCheckpoint(messageId);
      return;
    }

    if (!event.payload) {
      throw new Error('LogiPeople stream event missing payload');
    }

    const payload = logipeopleEmployeeHiredEventSchema.shape.data.parse(JSON.parse(event.payload)) as unknown as EmployeeHiredPayload;
    const eventId = event.eventId || messageId;
    const producer = event.producer || 'logipeople-worker';
    const fullName = `LogiPeople employee ${payload.employeeId.slice(0, 8)}`;

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
        await this.pool.query(
          `
            INSERT INTO "PayrollEmployeeReference" (id, "logiPeopleId", "fullName", status, "createdAt", "updatedAt")
            VALUES ($1, $2, $3, 'ACTIVE', NOW(), NOW())
            ON CONFLICT ("logiPeopleId") DO UPDATE
            SET status = 'ACTIVE',
                "updatedAt" = NOW()
          `,
          [randomUUID(), payload.employeeId, fullName],
        );
      }

      await this.upsertCheckpoint(messageId);
      await this.pool.query('COMMIT');
    } catch (error) {
      await this.pool.query('ROLLBACK');
      throw error;
    }

    this.logger.info(
      {
        operation: 'logipeople.employee_hired.consumed',
        streamMessageId: messageId,
        eventId,
        employeeId: payload.employeeId,
      },
      'LogiPeople employee hired event consumed',
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

function parseStreamFields(fields: string[]) {
  const record: Record<string, string> = {};
  for (let index = 0; index < fields.length; index += 2) {
    record[fields[index] ?? ''] = fields[index + 1] ?? '';
  }
  return record;
}
