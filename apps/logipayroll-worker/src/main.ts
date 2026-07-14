import { createPlatformLogger } from '@logipeople/logger';

const logger = createPlatformLogger('logipayroll-worker');

logger.info({ module: 'worker', operation: 'bootstrap', status: 'ready' }, 'LogiPayroll worker ready');

process.on('SIGTERM', () => {
  logger.info({ module: 'worker', operation: 'shutdown', status: 'ok' }, 'LogiPayroll worker stopped');
  process.exit(0);
});
