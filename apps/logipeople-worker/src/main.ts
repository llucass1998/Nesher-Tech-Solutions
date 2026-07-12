import { createPlatformLogger } from '@logipeople/logger';

const logger = createPlatformLogger('logipeople-worker');

logger.info({ module: 'worker', operation: 'bootstrap', status: 'ready' }, 'LogiPeople worker ready');

process.on('SIGTERM', () => {
  logger.info({ module: 'worker', operation: 'shutdown', status: 'ok' }, 'LogiPeople worker stopped');
  process.exit(0);
});
