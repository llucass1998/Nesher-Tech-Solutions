# LogiDesk

Data: 2026-07-14

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
- Criacao manual de tickets operacionais.
- Criacao idempotente de ticket a partir de ocorrencia do LogiFlow.
- Mensagens.
- Notas internas.
- Edicao de notas internas.
- Anexos como metadados auditados, com URL/storage key, limite de tamanho, HTTPS obrigatorio, allowlist de MIME e extensao compativel.
- Equipes de suporte.
- Categorias.
- Tags.
- Atribuicao, troca de equipe e historico de atribuicoes.
- Transicoes de status com validacao de maquina de estados.
- Mudanca de prioridade.
- Arquivamento/cancelamento.
- Notificacoes internas para atribuicao de chamados.
- Preferencias preliminares de notificacao por usuario operacional.
- Socket.IO autenticado por JWT Identity no backend.
- Emissao inicial de `notification:created` para usuarios, equipes e suporte.
- Historico.
- SLA por prioridade com primeira resposta, pausa, retomada e conclusao operacional.
- Worker de SLA para alerta e violacao automaticos.
- Relatorio agregado operacional para dashboard.
- Outbox LogiDesk.
- Dead-letter table com API administrativa inicial de listagem e reprocessamento.
- Auditoria.
- Health checks `GET /api/v1/health/live` e `GET /api/v1/health/ready`.
- Web com dashboard baseado em relatorio agregado, lista de chamados, Kanban, SLA, relatorios, notificacoes e configuracoes com equipes, categorias e tags.

## API principal

Base local:

```text
http://localhost:3533/api/v1
```

Rotas:

- `GET /health/live`
- `GET /health/ready`
- `GET /tickets`
- `POST /tickets`
- `POST /tickets/from-logiflow`
- `GET /tickets/:id`
- `GET /tickets/:id/public`
- `PATCH /tickets/:id`
- `DELETE /tickets/:id`
- `PATCH /tickets/:id/status`
- `PATCH /tickets/:id/priority`
- `POST /tickets/:id/messages`
- `POST /tickets/:id/notes`
- `GET /tickets/:id/internal-notes`
- `POST /tickets/:id/internal-notes`
- `PATCH /tickets/:id/internal-notes/:noteId`
- `GET /tickets/:id/attachments`
- `POST /tickets/:id/attachments`
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `GET /notification-preferences/:userId`
- `PATCH /notification-preferences/:userId`
- `GET /reports/summary`
- `GET /dead-letter-events`
- `POST /dead-letter-events/:id/reprocess`
- `POST /tickets/:id/assign`
- `DELETE /tickets/:id/assign`
- `POST /tickets/:id/change-team`
- `GET /tickets/:id/assignments`
- `GET /teams`
- `POST /teams`
- `PATCH /teams/:id`
- `DELETE /teams/:id`
- `GET /categories`
- `POST /categories`
- `PATCH /categories/:id`
- `DELETE /categories/:id`
- `GET /tags`
- `POST /tags`
- `PATCH /tags/:id`
- `DELETE /tags/:id`

`POST /tickets/from-logiflow` exige:

- `x-service-token`
- `idempotency-key`
- `correlationId` no payload

As rotas administrativas de DLQ aceitam `x-service-token` ou JWT Identity com role `ADMIN`/`SUPPORT`.

## Socket.IO

Endpoint:

```text
ws://localhost:3533/socket.io
```

A conexao exige token Identity no handshake:

- `auth.token` com JWT ou `Bearer <jwt>`;
- ou header `Authorization`.

Rooms criadas automaticamente no backend:

- `user:{userId}`;
- `role:{role}`;
- `support` para roles `SUPPORT` e `ADMIN`.

Rooms usadas para emissao:

- `user:{userId}`;
- `team:{teamId}`;
- `ticket:{ticketId}`;
- `support`.

Evento implementado nesta etapa:

- `notification:created`.

O backend ja emite notificacoes persistidas para rooms de usuario, equipe e suporte. Inscricao dinamica em rooms de ticket pelo browser e consumo realtime no frontend ainda precisam evoluir antes de marcar Socket.IO como completo.

`POST /tickets/:id/attachments` registra somente metadados do arquivo:

- `fileName`
- `contentType`
- `sizeBytes` ate 25 MB
- `url`
- `storageKey` opcional
- `uploadedById` opcional
- `correlationId`

O endpoint cria historico, auditoria e outbox. A API rejeita URL sem HTTPS, path traversal no nome, MIME fora da allowlist e extensao incompatível com o MIME. Upload binario, object storage, varredura antivirus e politicas de retencao ainda nao estao implementados.

`GET /notifications` aceita filtros `userId`, `teamId` e `unread=true`. `PATCH /notifications/:id/read` marca uma notificacao como lida. Nesta etapa, notificacoes sao criadas automaticamente quando um chamado e atribuido a usuario ou equipe.

`GET /reports/summary` retorna agregados operacionais sem dados sensiveis: totais, chamados ativos, chamados sem responsavel, notificacoes nao lidas, distribuicao por status, prioridade, origem e SLA.

`GET /dead-letter-events` lista eventos em DLQ e aceita filtro `correlationId`. `POST /dead-letter-events/:id/reprocess` recoloca o outbox vinculado em `PENDING`, zera tentativas, limpa o erro e registra auditoria sem apagar o registro de DLQ.

O dashboard web consome `/reports/summary` para os cards e distribuicoes, e `/tickets` apenas para a fila recente.

A pagina `/reports` consome `/reports/summary` e exibe totais, alertas de prioridade/SLA e distribuicoes por status, prioridade, origem e SLA.

A pagina `/notifications` consome `GET /notifications?unread=true`, exibe alertas pendentes de atribuicao, SLA e eventos operacionais, e permite marcar cada notificacao como lida pela web usando `PATCH /notifications/:id/read`.

A pagina `/settings` consome `GET /notification-preferences/logidesk-web` e grava preferencias preliminares com `PATCH /notification-preferences/:userId`. A API respeita essas preferencias ao criar notificacoes de usuario. Esta etapa usa um `userId` operacional fixo ate o frontend concluir o SSO real do LogiIdentity.

A pagina `/settings` tambem lista, cria e desativa equipes, categorias e tags usando os endpoints de catalogo existentes. As regras de ownership/RBAC reais ainda dependem da conclusao do SSO frontend.

## Limites atuais

- SSO/JWKS basico existe via `GET /api/v1/auth/me`; frontend SSO completo ainda precisa evoluir.
- Socket.IO autenticado ja existe no backend e emite `notification:created`; frontend ainda nao consome esses eventos e ainda falta validacao E2E em browser.
- Preferencias de notificacao existem como persistencia/API/web preliminar e filtram criacao de notificacoes internas por usuario, mas ainda nao filtram entrega em tempo real por usuario autenticado.
- Catalogos de equipes, categorias e tags ja possuem API e UI administrativa preliminar, mas ainda precisam de RBAC frontend real.
- Worker LogiDesk despacha eventos com referencia LogiFlow de volta para o LogiFlow e publica espelho operacional em Redis Stream; DLQ do LogiDesk ja pode ser listada e reprocessada pela API, mas ainda falta validacao fim a fim com containers.
- E2E Playwright completo LogiFlow -> LogiDesk ainda nao foi criado.
- SLA registra primeira resposta, pausa em `WAITING_CUSTOMER`, retomada em `IN_PROGRESS`, conclusao em `RESOLVED`/`CLOSED` e alerta/violacao automaticos pelo worker. Calendario comercial e feriados ainda precisam evoluir.

## Validacao recente

- `npm run logidesk:prisma:generate`: PASS.
- `npx prisma validate --config apps/logidesk-api/prisma.config.ts`: PASS.
- `npm run typecheck -w logidesk-api`: PASS.
- `npm run test -w logidesk-api`: PASS, 23 testes.
- `npm run typecheck -w logidesk-worker`: PASS.
- `npm run build -w logidesk-worker`: PASS.
- `npm run typecheck -w logidesk-web`: PASS.
- `npm run build -w logidesk-web`: PASS, incluindo `/reports`.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run test:workspaces`: PASS.
- `npm run build:workspaces`: PASS.
- `npm audit --audit-level=high`: PASS.
- `docker compose build logidesk-migrate logidesk-api logidesk-web`: PASS.
- `docker compose --env-file .env.example build logidesk-web`: PASS apos leitura web de notificacoes.
- `docker compose --env-file .env.example build logidesk-migrate logidesk-api logidesk-web`: PASS apos preferencias de notificacao.

## Guardrail

Nao considerar a integracao pronta apenas por HTTP 200. Para marcar PASS completo, validar persistencia nos dois bancos, outbox, worker, idempotencia, logs correlacionados, retry/DLQ e E2E.
