import { logipayrollContractCreatedDataSchema, logipayrollLeaveApprovedEventSchema, logipayrollEmployeeUnavailableEventSchema, logipayrollEmployeeAvailableEventSchema } from '@logipeople/event-contracts';

export interface OutboxEventRow {
  id: string;
  eventType: string;
  eventVersion: number;
  payload: unknown;
  attempts: number;
  correlationId: string | null;
  causationId: string | null;
}

export interface QueryClient {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<{ rows: T[]; rowCount?: number | null }>;
}

export interface TransactionClient extends QueryClient {
  release(): void;
}

export interface DatabasePool extends QueryClient {
  connect(): Promise<TransactionClient>;
}

export interface StreamPublisher {
  xadd(...args: string[]): Promise<unknown>;
}

export interface WorkerLogger {
  info(payload: Record<string, unknown>, message: string): void;
  warn(payload: Record<string, unknown>, message: string): void;
  error(payload: Record<string, unknown>, message: string): void;
}

export interface DispatcherConfig {
  maxAttempts: number;
  retryBaseDelaySeconds: number;
  retryMaxDelaySeconds: number;
  eventStreamName: string;
  eventStreamMaxLen: number;
}

export class LogiPayrollOutboxDispatcher {
  constructor(
    private readonly pool: DatabasePool | null,
    private readonly streamPublisher: StreamPublisher,
    private readonly logger: WorkerLogger,
    private readonly config: DispatcherConfig,
  ) {}

  async dispatchPendingOutboxBatch() {
    if (!this.pool) {
      this.logger.warn({ operation: 'outbox.dispatch', status: 'skipped', reason: 'LOGIPAYROLL_DATABASE_URL missing' }, 'Outbox dispatch skipped');
      return;
    }

    for (let processed = 0; processed < 10; processed += 1) {
      const event = await this.claimNextOutboxEvent();
      if (!event) return;
      await this.dispatchOutboxEvent(event);
    }
  }

  async claimNextOutboxEvent(): Promise<OutboxEventRow | null> {
    if (!this.pool) return null;

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<OutboxEventRow>(
        `
          SELECT id, "eventType", "eventVersion", payload, attempts, "correlationId", "causationId"
          FROM "OutboxEvent"
          WHERE (
              status = 'PENDING'
              OR (
                status = 'FAILED'
                AND "createdAt" <= NOW() - (
                  LEAST($2::int, $3::int * POWER(2, GREATEST(attempts - 1, 0))) * INTERVAL '1 second'
                )
              )
            )
            AND attempts < $1
          ORDER BY "createdAt" ASC
          LIMIT 1
          FOR UPDATE SKIP LOCKED
        `,
        [this.config.maxAttempts, this.config.retryMaxDelaySeconds, this.config.retryBaseDelaySeconds],
      );

      const event = result.rows[0];
      if (!event) {
        await client.query('COMMIT');
        return null;
      }

      await client.query(
        `
          UPDATE "OutboxEvent"
          SET status = 'PROCESSING',
              attempts = attempts + 1,
              "lastError" = NULL
          WHERE id = $1
        `,
        [event.id],
      );
      await client.query('COMMIT');
      return { ...event, attempts: event.attempts + 1 };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async dispatchOutboxEvent(event: OutboxEventRow) {
    try {
      const payload = this.validatePayload(event);
      await this.publishStreamEvent(event, payload);
      await this.markCompleted(event.id);

      this.logger.info(
        {
          operation: 'outbox.dispatch',
          outboxEventId: event.id,
          eventType: event.eventType,
          correlationId: event.correlationId,
          attempts: event.attempts,
          status: 'PROCESSED',
        },
        'LogiPayroll outbox event published',
      );
    } catch (error) {
      await this.markFailed(event, error);
    }
  }

  private validatePayload(event: OutboxEventRow) {
    if (event.eventType === 'logipayroll.contract.created') {
      return logipayrollContractCreatedDataSchema.parse(event.payload);
    }
    if (event.eventType === 'logipayroll.leave.approved') {
      return logipayrollLeaveApprovedEventSchema.shape.data.parse(event.payload);
    }
    if (event.eventType === 'logipayroll.employee.unavailable') {
      return logipayrollEmployeeUnavailableEventSchema.shape.data.parse(event.payload);
    }
    if (event.eventType === 'logipayroll.employee.available') {
      return logipayrollEmployeeAvailableEventSchema.shape.data.parse(event.payload);
    }

    throw new PermanentDispatchError(`Unsupported LogiPayroll outbox event type: ${event.eventType}`);
  }


  private async publishStreamEvent(event: OutboxEventRow, payload: unknown) {
    await this.streamPublisher.xadd(
      this.config.eventStreamName,
      'MAXLEN',
      '~',
      String(this.config.eventStreamMaxLen),
      '*',
      'eventId',
      event.id,
      'eventType',
      event.eventType,
      'eventVersion',
      String(event.eventVersion),
      'correlationId',
      event.correlationId ?? '',
      'causationId',
      event.causationId ?? '',
      'producer',
      'logipayroll-worker',
      'status',
      'published',
      'payload',
      JSON.stringify(payload),
    );
  }

  private async markCompleted(outboxEventId: string) {
    if (!this.pool) return;
    await this.pool.query(
      `
        UPDATE "OutboxEvent"
        SET status = 'PROCESSED',
            "processedAt" = NOW(),
            "lastError" = NULL
        WHERE id = $1
      `,
      [outboxEventId],
    );
  }

  private async markFailed(event: OutboxEventRow, error: unknown) {
    if (!this.pool) return;

    const message = error instanceof Error ? error.message : 'Unknown dispatch error';
    const isPermanent = error instanceof PermanentDispatchError;
    const shouldDeadLetter = isPermanent || event.attempts >= this.config.maxAttempts;
    const status = shouldDeadLetter ? 'DEAD_LETTER' : 'FAILED';
    const retryDelaySeconds = shouldDeadLetter ? null : calculateRetryDelaySeconds(
      event.attempts,
      this.config.retryBaseDelaySeconds,
      this.config.retryMaxDelaySeconds,
    );

    await this.pool.query('BEGIN');
    try {
      await this.pool.query(
        `
          UPDATE "OutboxEvent"
          SET status = $2,
              "lastError" = $3
          WHERE id = $1
        `,
        [event.id, status, message],
      );

      if (shouldDeadLetter) {
        await this.pool.query(
          `
            INSERT INTO "DeadLetterEvent" ("outboxEventId", "eventType", payload, error, "correlationId")
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT ("outboxEventId") DO NOTHING
          `,
          [event.id, event.eventType, event.payload, message, event.correlationId],
        );
      }

      await this.pool.query('COMMIT');
    } catch (transactionError) {
      await this.pool.query('ROLLBACK');
      throw transactionError;
    }

    this.logger.error(
      {
        operation: 'outbox.dispatch',
        outboxEventId: event.id,
        eventType: event.eventType,
        correlationId: event.correlationId,
        attempts: event.attempts,
        status,
        retryDelaySeconds,
        error: message,
      },
      'LogiPayroll outbox event dispatch failed',
    );
  }
}

export class PermanentDispatchError extends Error {}

export function calculateRetryDelaySeconds(attempts: number, retryBaseDelaySeconds: number, retryMaxDelaySeconds: number) {
  return Math.min(retryMaxDelaySeconds, retryBaseDelaySeconds * 2 ** Math.max(attempts - 1, 0));
}
