import { createPlatformLogger } from '@logipeople/logger';
import { Redis } from 'ioredis';
import { Pool } from 'pg';
import { LogiPeopleOutboxDispatcher } from './outbox-dispatcher.js';
import { LogideskConsumer } from './logidesk-consumer.js';

const logger = createPlatformLogger('logipeople-worker');
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const databaseUrl = process.env.LOGIPEOPLE_DATABASE_URL;
const pollIntervalMs = Number(process.env.LOGIPEOPLE_OUTBOX_POLL_INTERVAL_MS ?? 5000);
const maxAttempts = Number(process.env.LOGIPEOPLE_OUTBOX_MAX_ATTEMPTS ?? 5);
const retryBaseDelaySeconds = Number(process.env.LOGIPEOPLE_OUTBOX_RETRY_BASE_DELAY_SECONDS ?? 30);
const retryMaxDelaySeconds = Number(process.env.LOGIPEOPLE_OUTBOX_RETRY_MAX_DELAY_SECONDS ?? 900);
const eventStreamName = process.env.LOGIPEOPLE_EVENT_STREAM ?? 'logipeople.events';
const eventStreamMaxLen = Math.max(100, Number(process.env.EVENT_STREAM_MAXLEN ?? 10000));
const logideskEventStreamName = process.env.LOGIDESK_EVENT_STREAM ?? 'logidesk.events';
const logideskConsumerBatchSize = Number(process.env.LOGIPEOPLE_LOGIDESK_CONSUMER_BATCH_SIZE ?? 10);
const logideskConsumerBlockMs = Number(process.env.LOGIPEOPLE_LOGIDESK_CONSUMER_BLOCK_MS ?? 100);

const streamPublisher = new Redis(redisUrl, { maxRetriesPerRequest: null });
const pool = databaseUrl ? new Pool({ connectionString: databaseUrl }) : null;
const dispatcher = new LogiPeopleOutboxDispatcher(pool, streamPublisher, logger, {
  maxAttempts,
  retryBaseDelaySeconds,
  retryMaxDelaySeconds,
  eventStreamName,
  eventStreamMaxLen,
});

const logideskConsumer = new LogideskConsumer(pool, streamPublisher, logger, {
  consumerName: 'logipeople.logidesk.hr_cases',
  streamName: logideskEventStreamName,
  batchSize: logideskConsumerBatchSize,
  blockMs: logideskConsumerBlockMs,
});

const poller = setInterval(() => {
  void dispatcher.dispatchPendingOutboxBatch();
  void logideskConsumer.consumeNextBatch();
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
  'LogiPeople worker ready',
);

async function shutdown() {
  clearInterval(poller);
  await streamPublisher.quit();
  await pool?.end();
  logger.info({ module: 'worker', operation: 'shutdown', status: 'ok' }, 'LogiPeople worker stopped');
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
