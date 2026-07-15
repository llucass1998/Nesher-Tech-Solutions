import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { createPlatformLogger } from '@logipeople/logger';
import { LogiPayrollAvailabilityConsumer } from './payroll-consumer.js';

const logger = createPlatformLogger('logiflow-worker');
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const databaseUrl = process.env.DATABASE_URL;
const logideskApiUrl = (process.env.LOGIDESK_API_URL ?? 'http://localhost:3533/api/v1').replace(/\/$/, '');
const logideskServiceToken = process.env.LOGIDESK_SERVICE_TOKEN;
const pollIntervalMs = Number(process.env.LOGIFLOW_OUTBOX_POLL_INTERVAL_MS ?? 5000);
const maxAttempts = Number(process.env.LOGIFLOW_OUTBOX_MAX_ATTEMPTS ?? 5);
const retryBaseDelaySeconds = Number(process.env.LOGIFLOW_OUTBOX_RETRY_BASE_DELAY_SECONDS ?? 30);
const retryMaxDelaySeconds = Number(process.env.LOGIFLOW_OUTBOX_RETRY_MAX_DELAY_SECONDS ?? 900);
const eventStreamName = process.env.LOGIFLOW_EVENT_STREAM ?? 'logiflow.events';
const eventStreamMaxLen = Math.max(100, Number(process.env.EVENT_STREAM_MAXLEN ?? 10000));
const logiPayrollEventStreamName = process.env.LOGIPAYROLL_EVENT_STREAM ?? 'logipayroll.events';
const logiPayrollConsumerBatchSize = Number(process.env.LOGIFLOW_LOGIPAYROLL_CONSUMER_BATCH_SIZE ?? 10);
const logiPayrollConsumerBlockMs = Number(process.env.LOGIFLOW_LOGIPAYROLL_CONSUMER_BLOCK_MS ?? 100);
const connection = buildRedisConnection(redisUrl);
const streamPublisher = new Redis(redisUrl, { maxRetriesPerRequest: null });
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
const logiPayrollConsumer = new LogiPayrollAvailabilityConsumer(pool, streamPublisher, logger, {
  consumerName: 'logiflow.logipayroll.availability',
  streamName: logiPayrollEventStreamName,
  batchSize: logiPayrollConsumerBatchSize,
  blockMs: logiPayrollConsumerBlockMs,
});

const worker = new Worker(
  'logiflow.outbox',
  async (job) => {
    logger.info(
      {
        operation: 'outbox.dispatch.job',
        jobId: job.id,
        eventType: job.data?.eventType,
        correlationId: job.data?.correlationId,
      },
      'Received LogiFlow outbox job',
    );
    await dispatchPendingOutboxBatch();
  },
  { connection },
);

const poller = setInterval(() => {
  void dispatchPendingOutboxBatch();
  void logiPayrollConsumer.consumeNextBatch();
}, pollIntervalMs);

logger.info(
  {
    module: 'worker',
    operation: 'bootstrap',
    redisUrl,
    hasDatabaseUrl: Boolean(databaseUrl),
    retryBaseDelaySeconds,
    retryMaxDelaySeconds,
    logiPayrollEventStreamName,
    status: 'ready',
  },
  'LogiFlow worker ready',
);

async function dispatchPendingOutboxBatch() {
  if (!pool) {
    logger.warn({ operation: 'outbox.dispatch', status: 'skipped', reason: 'DATABASE_URL missing' }, 'Outbox dispatch skipped');
    return;
  }

  for (let processed = 0; processed < 10; processed += 1) {
    const event = await claimNextOutboxEvent();
    if (!event) return;
    await dispatchOutboxEvent(event);
  }
}

async function claimNextOutboxEvent(): Promise<OutboxEventRow | null> {
  if (!pool) return null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<OutboxEventRow>(
      `
        SELECT id, "eventType", "eventVersion", payload, attempts, "correlationId", "causationId", "idempotencyKey"
        FROM "OutboxEvent"
        WHERE (
            status = 'PENDING'
            OR (
              status = 'FAILED'
              AND "updatedAt" <= NOW() - (
                LEAST($2::int, $3::int * POWER(2, GREATEST(attempts - 1, 0))) * INTERVAL '1 second'
              )
            )
          )
          AND attempts < $1
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `,
      [maxAttempts, retryMaxDelaySeconds, retryBaseDelaySeconds],
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
            "lastError" = NULL,
            "updatedAt" = NOW()
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

async function dispatchOutboxEvent(event: OutboxEventRow) {
  try {
    if (event.eventType !== 'logiflow.occurrence.escalated' && event.eventType !== 'logiflow.occurrence_escalated') {
      throw new PermanentDispatchError(`Unsupported LogiFlow outbox event type: ${event.eventType}`);
    }

    await markCompleted(event.id);
    await publishStreamEvent(event, 'completed');
    logger.info(
      {
        operation: 'outbox.dispatch',
        outboxEventId: event.id,
        eventType: event.eventType,
        correlationId: event.correlationId,
        attempts: event.attempts,
        status: 'completed',
      },
      'LogiFlow outbox event published to Redis Stream',
    );
  } catch (error) {
    await markFailed(event, error);
  }
}


async function markCompleted(outboxEventId: string) {
  if (!pool) return;
  await pool.query(
    `
      UPDATE "OutboxEvent"
      SET status = 'COMPLETED',
          "processedAt" = NOW(),
          "lastError" = NULL,
          "updatedAt" = NOW()
      WHERE id = $1
    `,
    [outboxEventId],
  );
}

async function markFailed(event: OutboxEventRow, error: unknown) {
  if (!pool) return;

  const message = error instanceof Error ? error.message : 'Unknown dispatch error';
  const isPermanent = error instanceof PermanentDispatchError;
  const shouldDeadLetter = isPermanent || event.attempts >= maxAttempts;
  const status = shouldDeadLetter ? 'DEAD_LETTER' : 'FAILED';
  const retryDelaySeconds = shouldDeadLetter ? null : calculateRetryDelaySeconds(event.attempts);

  await pool.query('BEGIN');
  try {
    await pool.query(
      `
        UPDATE "OutboxEvent"
        SET status = $2,
            "lastError" = $3,
            "updatedAt" = NOW()
        WHERE id = $1
      `,
      [event.id, status, message],
    );

    if (shouldDeadLetter) {
      await pool.query(
        `
          INSERT INTO "DeadLetterEvent" ("outboxEventId", "eventType", payload, error, "correlationId")
          VALUES ($1, $2, $3, $4, $5)
        `,
        [event.id, event.eventType, event.payload, message, event.correlationId],
      );
    }

    await pool.query('COMMIT');
  } catch (transactionError) {
    await pool.query('ROLLBACK');
    throw transactionError;
  }

  await publishStreamEvent(event, status.toLowerCase());

  logger.error(
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
    'LogiFlow outbox event dispatch failed',
  );
}

async function shutdown() {
  clearInterval(poller);
  await worker.close();
  await streamPublisher.quit();
  await pool?.end();
  logger.info({ module: 'worker', operation: 'shutdown', status: 'ok' }, 'LogiFlow worker stopped');
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

function buildRedisConnection(value: string) {
  const url = new URL(value);
  return {
    host: url.hostname,
    port: Number(url.port || 6379),
    password: url.password || undefined,
    maxRetriesPerRequest: null,
  };
}

function asString(value: unknown) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new PermanentDispatchError('Outbox payload is missing a required string field');
  }
  return value;
}

function asOptionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function calculateRetryDelaySeconds(attempts: number) {
  return Math.min(retryMaxDelaySeconds, retryBaseDelaySeconds * 2 ** Math.max(attempts - 1, 0));
}

async function publishStreamEvent(event: OutboxEventRow, status: string) {
  try {
    await streamPublisher.xadd(
      eventStreamName,
      'MAXLEN',
      '~',
      eventStreamMaxLen,
      '*',
      'eventId',
      event.id,
      'eventType',
      event.eventType,
      'eventVersion',
      String(event.eventVersion),
      'correlationId',
      event.correlationId,
      'causationId',
      event.causationId ?? '',
      'producer',
      'logiflow-worker',
      'status',
      status,
      'payload',
      JSON.stringify(event.payload ?? {}),
    );
  } catch (error) {
    logger.warn(
      {
        operation: 'redis_stream.publish',
        stream: eventStreamName,
        outboxEventId: event.id,
        eventType: event.eventType,
        correlationId: event.correlationId,
        error: error instanceof Error ? error.message : 'Unknown Redis Streams error',
      },
      'LogiFlow event stream publish failed',
    );
  }
}

class PermanentDispatchError extends Error {}

interface OutboxEventRow {
  id: string;
  eventType: string;
  eventVersion: number;
  payload: unknown;
  attempts: number;
  correlationId: string;
  causationId: string | null;
  idempotencyKey: string;
}
