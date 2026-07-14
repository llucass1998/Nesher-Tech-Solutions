import { Worker } from 'bullmq';
import { Pool } from 'pg';
import { createPlatformLogger } from '@logipeople/logger';

const logger = createPlatformLogger('logidesk-worker');
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const databaseUrl = process.env.LOGIDESK_DATABASE_URL;
const logiflowApiUrl = (process.env.LOGIFLOW_API_URL ?? 'http://localhost:3333/api/v1').replace(/\/$/, '');
const serviceToken = process.env.LOGIDESK_SERVICE_TOKEN;
const pollIntervalMs = Number(process.env.LOGIDESK_OUTBOX_POLL_INTERVAL_MS ?? 5000);
const maxAttempts = Number(process.env.LOGIDESK_OUTBOX_MAX_ATTEMPTS ?? 5);
const connection = buildRedisConnection(redisUrl);
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;

const outboxWorker = new Worker(
  'logidesk.outbox',
  async (job) => {
    logger.info(
      {
        operation: 'outbox.process.job',
        jobId: job.id,
        eventType: job.data?.eventType,
        correlationId: job.data?.correlationId,
      },
      'Received LogiDesk outbox job',
    );
    await dispatchPendingOutboxBatch();
  },
  { connection },
);

const slaWorker = new Worker(
  'logidesk.sla',
  async (job) => {
    logger.info(
      {
        operation: 'sla.evaluate',
        jobId: job.id,
        correlationId: job.data?.correlationId,
      },
      'Evaluating LogiDesk SLA',
    );
  },
  { connection },
);

const poller = setInterval(() => {
  void dispatchPendingOutboxBatch();
}, pollIntervalMs);

logger.info(
  {
    module: 'worker',
    operation: 'bootstrap',
    redisUrl,
    logiflowApiUrl,
    hasDatabaseUrl: Boolean(databaseUrl),
    hasServiceToken: Boolean(serviceToken),
    status: 'ready',
  },
  'LogiDesk worker ready',
);

async function dispatchPendingOutboxBatch() {
  if (!pool) {
    logger.warn({ operation: 'outbox.dispatch', status: 'skipped', reason: 'LOGIDESK_DATABASE_URL missing' }, 'Outbox dispatch skipped');
    return;
  }

  if (!serviceToken) {
    logger.error(
      { operation: 'outbox.dispatch', status: 'failed_configuration', reason: 'LOGIDESK_SERVICE_TOKEN missing' },
      'Outbox dispatch cannot call LogiFlow without service token',
    );
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
        SELECT id, "eventType", "eventVersion", payload, attempts, "correlationId", "causationId"
        FROM "OutboxEvent"
        WHERE status IN ('PENDING', 'FAILED')
          AND attempts < $1
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `,
      [maxAttempts],
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
    const body = mapTicketEventToLogiflowRequest(event);
    if (!body) {
      await markCompleted(event.id);
      logger.info(
        {
          operation: 'outbox.dispatch',
          outboxEventId: event.id,
          eventType: event.eventType,
          correlationId: event.correlationId,
          status: 'skipped_no_logiflow_reference',
        },
        'LogiDesk outbox event has no LogiFlow reference',
      );
      return;
    }

    const response = await fetch(`${logiflowApiUrl}/integrations/logidesk/ticket-updates`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-service-token': serviceToken!,
        'x-correlation-id': event.correlationId,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await response.text();
    if (!response.ok) {
      const message = `LogiFlow responded ${response.status}: ${responseBody.slice(0, 500)}`;
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new PermanentDispatchError(message);
      }
      throw new Error(message);
    }

    await markCompleted(event.id);
    logger.info(
      {
        operation: 'outbox.dispatch',
        outboxEventId: event.id,
        eventType: event.eventType,
        correlationId: event.correlationId,
        attempts: event.attempts,
        status: 'completed',
      },
      'LogiDesk outbox event dispatched to LogiFlow',
    );
  } catch (error) {
    await markFailed(event, error);
  }
}

function mapTicketEventToLogiflowRequest(event: OutboxEventRow) {
  const payload = event.payload as Record<string, unknown>;
  const occurrenceId = asOptionalString(payload.occurrenceId);
  const ticketNumber = asOptionalString(payload.ticketNumber);

  if (!occurrenceId || !ticketNumber) {
    return null;
  }

  return {
    eventType: toNamespacedTicketEventType(event.eventType),
    occurrenceId,
    deliveryId: asOptionalString(payload.deliveryId),
    ticketId: asOptionalString(payload.ticketId),
    ticketNumber,
    status: asOptionalString(payload.status) ?? inferStatusFromEvent(event.eventType),
    message: asOptionalString(payload.message),
    correlationId: event.correlationId,
  };
}

function toNamespacedTicketEventType(eventType: string) {
  if (eventType.startsWith('logidesk.')) return eventType;
  if (eventType === 'ticket.created') return 'logidesk.ticket.created';
  if (eventType === 'ticket.updated') return 'logidesk.ticket.status_changed';
  if (eventType === 'ticket.status_changed') return 'logidesk.ticket.status_changed';
  if (eventType === 'ticket.message_created') return 'logidesk.ticket.message_created';
  if (eventType === 'ticket.resolved') return 'logidesk.ticket.resolved';
  return `logidesk.${eventType}`;
}

function inferStatusFromEvent(eventType: string) {
  if (eventType.endsWith('resolved')) return 'RESOLVED';
  if (eventType.endsWith('closed')) return 'CLOSED';
  return undefined;
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

  logger.error(
    {
      operation: 'outbox.dispatch',
      outboxEventId: event.id,
      eventType: event.eventType,
      correlationId: event.correlationId,
      attempts: event.attempts,
      status,
      error: message,
    },
    'LogiDesk outbox event dispatch failed',
  );
}

async function shutdown() {
  clearInterval(poller);
  await Promise.all([outboxWorker.close(), slaWorker.close()]);
  await pool?.end();
  logger.info({ module: 'worker', operation: 'shutdown', status: 'ok' }, 'LogiDesk worker stopped');
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

function asOptionalString(value: unknown) {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
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
}
