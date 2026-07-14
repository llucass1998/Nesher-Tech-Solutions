import { createPlatformLogger } from '@logipeople/logger';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { LogiPayrollOutboxDispatcher } from './outbox-dispatcher';

const logger = createPlatformLogger('logipayroll-worker');
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const databaseUrl = process.env.LOGIPAYROLL_DATABASE_URL;
const pollIntervalMs = Number(process.env.LOGIPAYROLL_OUTBOX_POLL_INTERVAL_MS ?? 5000);
const maxAttempts = Number(process.env.LOGIPAYROLL_OUTBOX_MAX_ATTEMPTS ?? 5);
const retryBaseDelaySeconds = Number(process.env.LOGIPAYROLL_OUTBOX_RETRY_BASE_DELAY_SECONDS ?? 30);
const retryMaxDelaySeconds = Number(process.env.LOGIPAYROLL_OUTBOX_RETRY_MAX_DELAY_SECONDS ?? 900);
const eventStreamName = process.env.LOGIPAYROLL_EVENT_STREAM ?? 'logipayroll.events';
const eventStreamMaxLen = Math.max(100, Number(process.env.EVENT_STREAM_MAXLEN ?? 10000));
const streamPublisher = new Redis(redisUrl, { maxRetriesPerRequest: null });
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
const dispatcher = new LogiPayrollOutboxDispatcher(pool, streamPublisher, logger, {
  maxAttempts,
  retryBaseDelaySeconds,
  retryMaxDelaySeconds,
  eventStreamName,
  eventStreamMaxLen,
});

const poller = setInterval(() => {
  void dispatcher.dispatchPendingOutboxBatch();
}, pollIntervalMs);

logger.info(
  {
    module: 'worker',
    operation: 'bootstrap',
    redisUrl: redactUrl(redisUrl),
    hasDatabaseUrl: Boolean(databaseUrl),
    retryBaseDelaySeconds,
    retryMaxDelaySeconds,
    eventStreamName,
    status: 'ready',
  },
  'LogiPayroll worker ready',
);

async function shutdown() {
  clearInterval(poller);
  await streamPublisher.quit();
  await pool?.end();
  logger.info({ module: 'worker', operation: 'shutdown', status: 'ok' }, 'LogiPayroll worker stopped');
  process.exit(0);
}

function redactUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.password) url.password = '***';
    return url.toString();
  } catch {
    return '<invalid-url>';
  }
}

process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());
