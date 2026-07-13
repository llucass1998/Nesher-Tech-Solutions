# Observability

## LogiFlow implementado

Arquivos:

- `src/lib/logger.ts`
- `src/lib/observability.ts`
- `src/server.ts`

Recursos:

- Logger estruturado com redaction.
- `x-request-id`.
- `x-correlation-id`.
- Log HTTP com metodo, rota, status e duracao.
- Health live.
- Health ready com banco.
- Metricas HTTP em texto Prometheus.

Endpoints:

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/metrics`

## Campos recomendados

- `requestId`
- `correlationId`
- `service`
- `operation`
- `userId`
- `role`
- `method`
- `path`
- `statusCode`
- `durationMs`

## Redaction

Nunca logar:

- `authorization`
- `cookie`
- `password`
- `passwordHash`
- `refreshToken`
- `refreshTokenHash`
- `token`

## Futuro

Preparar sem tornar obrigatorio localmente:

- OpenTelemetry;
- Prometheus;
- Grafana;
- Sentry.
