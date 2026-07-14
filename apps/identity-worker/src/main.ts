import { Worker } from 'bullmq';
import { createPlatformLogger } from '@logipeople/logger';

const logger = createPlatformLogger('identity-worker');
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const connection = buildRedisConnection(redisUrl);

const outboxWorker = new Worker(
  'identity.outbox',
  async (job) => {
    logger.info(
      {
        operation: 'identity.outbox.process',
        jobId: job.id,
        eventType: job.data?.eventType,
        correlationId: job.data?.correlationId,
      },
      'Processing Identity outbox event',
    );
  },
  { connection },
);

logger.info({ module: 'worker', operation: 'bootstrap', redisUrl, status: 'ready' }, 'Identity worker ready');

async function shutdown() {
  await outboxWorker.close();
  logger.info({ module: 'worker', operation: 'shutdown', status: 'ok' }, 'Identity worker stopped');
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
