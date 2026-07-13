import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/prisma';
import { requestContext, resetMetricsForTests } from '../lib/observability';
import { routes } from '../routes';

vi.mock('../lib/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
    vehicle: {
      count: vi.fn(),
    },
    driver: {
      count: vi.fn(),
    },
    delivery: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('../lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(requestContext);
  app.use(routes);
  return app;
}

describe('observabilidade da API', () => {
  const app = createTestApp();

  beforeEach(() => {
    vi.clearAllMocks();
    resetMetricsForTests();
  });

  it('adiciona requestId e correlationId aos responses', async () => {
    const response = await request(app)
      .get('/api/v1/health/live')
      .set('x-request-id', 'req-test')
      .set('x-correlation-id', 'corr-test');

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).toBe('req-test');
    expect(response.headers['x-correlation-id']).toBe('corr-test');
    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'logiflow-api',
    });
  });

  it('valida readiness com banco', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ '?column?': 1 }]);

    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      status: 'ready',
      checks: { database: 'ok' },
    });
  });

  it('readiness retorna 503 quando o banco falha', async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('database offline'));

    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(503);
    expect(response.body).toMatchObject({
      status: 'not_ready',
      checks: { database: 'error' },
    });
  });

  it('exibe metricas HTTP em formato Prometheus text', async () => {
    await request(app).get('/api/v1/health/live');

    const response = await request(app).get('/api/v1/metrics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toContain('logiflow_http_requests_total');
    expect(response.text).toContain('method="GET"');
    expect(response.text).toContain('status_code="200"');
  });
});
