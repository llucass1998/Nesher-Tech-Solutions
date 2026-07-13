# LogiDesk

Data: 2026-07-13

## Estado atual

LogiDesk agora existe como fundacao operacional neste monorepo.

Apps:

- `apps/logidesk-api`: API NestJS.
- `apps/logidesk-web`: web Next.js App Router.
- `apps/logidesk-worker`: worker BullMQ para outbox/SLA.

Banco:

- `databases/logidesk`: Prisma schema e migrations.

## Funcionalidades implementadas

- Tickets com numero, status, prioridade, origem e referencias externas do LogiFlow.
- Criacao idempotente de ticket a partir de ocorrencia do LogiFlow.
- Mensagens.
- Notas internas.
- Historico.
- SLA preliminar por prioridade.
- Outbox LogiDesk.
- Dead-letter table.
- Auditoria.
- Health checks `GET /api/v1/health/live` e `GET /api/v1/health/ready`.
- Web com dashboard, lista de chamados, Kanban, SLA e configuracoes.

## API principal

Base local:

```text
http://localhost:3533/api/v1
```

Rotas:

- `GET /health/live`
- `GET /health/ready`
- `GET /tickets`
- `POST /tickets/from-logiflow`
- `GET /tickets/:id`
- `PATCH /tickets/:id`
- `POST /tickets/:id/messages`
- `POST /tickets/:id/notes`

`POST /tickets/from-logiflow` exige:

- `x-service-token`
- `idempotency-key`
- `correlationId` no payload

## Limites atuais

- SSO/JWKS real ainda nao foi conectado ao LogiFlow identity.
- Socket.IO ainda nao esta emitindo eventos para browsers.
- Worker BullMQ esta estruturado, mas o processamento de outbox ainda e inicial.
- E2E Playwright completo LogiFlow -> LogiDesk ainda nao foi criado.
- SLA e preliminar; calendario comercial, pausas e alertas completos ainda precisam evoluir.

## Guardrail

Nao considerar a integracao pronta apenas por HTTP 200. Para marcar PASS completo, validar persistencia nos dois bancos, outbox, worker, idempotencia, logs correlacionados, retry/DLQ e E2E.
