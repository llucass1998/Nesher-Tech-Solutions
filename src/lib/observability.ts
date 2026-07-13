import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { logger } from './logger';
import { prisma } from './prisma';

type HttpMetricKey = `${string} ${string} ${number}`;

const startedAt = new Date();
const httpRequests = new Map<HttpMetricKey, number>();
const httpDurationsMs = new Map<HttpMetricKey, number>();

function getHeaderValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function routePattern(req: Request) {
  return req.route?.path ? String(req.route.path) : req.path;
}

function incrementMetric(map: Map<HttpMetricKey, number>, key: HttpMetricKey, value = 1) {
  map.set(key, (map.get(key) ?? 0) + value);
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = getHeaderValue(req.headers['x-request-id']) ?? randomUUID();
  const correlationId = getHeaderValue(req.headers['x-correlation-id']) ?? requestId;
  const started = process.hrtime.bigint();

  res.locals.requestId = requestId;
  res.locals.correlationId = correlationId;
  res.setHeader('x-request-id', requestId);
  res.setHeader('x-correlation-id', correlationId);

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - started) / 1_000_000;
    const key: HttpMetricKey = `${req.method} ${routePattern(req)} ${res.statusCode}`;
    incrementMetric(httpRequests, key);
    incrementMetric(httpDurationsMs, key, durationMs);

    logger.info({
      event: 'http_request',
      requestId,
      correlationId,
      service: 'logiflow-api',
      operation: routePattern(req),
      userId: req.auth?.id,
      role: req.auth?.role,
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    });
  });

  return next();
}

export async function live(_req: Request, res: Response) {
  return res.json({
    status: 'ok',
    service: 'logiflow-api',
    uptimeSeconds: Math.floor(process.uptime()),
    startedAt: startedAt.toISOString(),
  });
}

export async function ready(_req: Request, res: Response) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return res.json({
      status: 'ready',
      service: 'logiflow-api',
      checks: {
        database: 'ok',
      },
    });
  } catch (error) {
    logger.error({ event: 'health_ready_failed', error });

    return res.status(503).json({
      status: 'not_ready',
      service: 'logiflow-api',
      checks: {
        database: 'error',
      },
    });
  }
}

export function metrics(_req: Request, res: Response) {
  const lines = [
    '# HELP logiflow_http_requests_total Total HTTP requests by method, route and status.',
    '# TYPE logiflow_http_requests_total counter',
  ];

  for (const [key, value] of httpRequests.entries()) {
    const [method, route, statusCode] = key.split(' ');
    lines.push(`logiflow_http_requests_total{method="${method}",route="${route}",status_code="${statusCode}"} ${value}`);
  }

  lines.push('# HELP logiflow_http_request_duration_ms_sum Total HTTP request duration in milliseconds.');
  lines.push('# TYPE logiflow_http_request_duration_ms_sum counter');

  for (const [key, value] of httpDurationsMs.entries()) {
    const [method, route, statusCode] = key.split(' ');
    lines.push(`logiflow_http_request_duration_ms_sum{method="${method}",route="${route}",status_code="${statusCode}"} ${Math.round(value * 100) / 100}`);
  }

  res.setHeader('content-type', 'text/plain; version=0.0.4; charset=utf-8');
  return res.send(`${lines.join('\n')}\n`);
}

export function resetMetricsForTests() {
  httpRequests.clear();
  httpDurationsMs.clear();
}
