import { Worker } from 'bullmq';
import { createPlatformLogger } from '@logipeople/logger';

const logger = createPlatformLogger('logiflow-worker');
const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
const logideskApiUrl = process.env.LOGIDESK_API_URL ?? 'http://localhost:3533/api/v1';
const connection = buildRedisConnection(redisUrl);

const worker = new Worker(
  'logiflow.outbox',
  async (job) => {
    logger.info(
      {
        operation: 'outbox.dispatch',
        jobId: job.id,
        eventType: job.data?.eventType,
        correlationId: job.data?.correlationId,
        target: logideskApiUrl,
      },
      'Dispatching LogiFlow integration event',
    );
  },
  { connection },
);

logger.info({ module: 'worker', operation: 'bootstrap', redisUrl, logideskApiUrl, status: 'ready' }, 'LogiFlow worker ready');

async function shutdown() {
  await worker.close();
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
