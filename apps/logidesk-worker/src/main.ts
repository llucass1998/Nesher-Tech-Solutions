import { Worker } from 'bullmq';
import { createPlatformLogger } from '@logipeople/logger';

const logger = createPlatformLogger('logidesk-worker');
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const connection = buildRedisConnection(redisUrl);

const outboxWorker = new Worker(
  'logidesk.outbox',
  async (job) => {
    logger.info(
      {
        operation: 'outbox.process',
        jobId: job.id,
        eventType: job.data?.eventType,
        correlationId: job.data?.correlationId,
      },
      'Processing LogiDesk outbox event',
    );
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

logger.info({ module: 'worker', operation: 'bootstrap', redisUrl, status: 'ready' }, 'LogiDesk worker ready');

async function shutdown() {
  await Promise.all([outboxWorker.close(), slaWorker.close()]);
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
