# API

## Base URLs locais

- LogiFlow API: `http://localhost:3333`
- LogiPeople API: `http://localhost:3433/api/v1`
- LogiDesk API: `http://localhost:3533/api/v1`

## LogiFlow health

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/metrics`

## LogiFlow auth v1

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## LogiFlow motorista

- `GET /api/v1/driver/me`
- `GET /api/v1/driver/deliveries`
- `GET /api/v1/driver/deliveries/:id`
- `PATCH /api/v1/driver/deliveries/:id/status`

## LogiFlow operacao

- `GET /api/v1/dashboard/metrics`
- `GET /api/v1/operations/deliveries`
- `GET /api/v1/operations/deliveries/:id/timeline`
- `PATCH /api/v1/operations/deliveries/:id/status`
- `POST /api/v1/operations/deliveries/:id/occurrences`
- `POST /api/v1/operations/deliveries/:id/proofs`
- `PATCH /api/v1/operations/occurrences/:id`
- `POST /api/v1/operations/occurrences/:id/reprocess`
- `POST /api/v1/operations/occurrences/:id/escalate`
- `GET /api/v1/operations/dead-letter-events`
- `POST /api/v1/operations/dead-letter-events/:id/reprocess`

As rotas operacionais exigem JWT v1 e roles `ADMIN` ou `OPERATOR`.

`GET /api/v1/operations/dead-letter-events` lista ate 100 eventos em DLQ do LogiFlow, com filtro opcional `correlationId`.

`POST /api/v1/operations/dead-letter-events/:id/reprocess` recoloca o `OutboxEvent` vinculado em `PENDING`, zera tentativas, limpa erro/processamento e, quando o payload possui `occurrenceId`, recoloca a ocorrencia em `PENDING`.

## Rotas legadas LogiFlow

Continuam ativas e depreciadas:

- `POST /login`
- `POST /users`
- `GET/POST/PUT/DELETE/PATCH /drivers`
- `GET/POST/PUT/DELETE/PATCH /vehicles`
- `GET/POST/PUT/DELETE/PATCH /deliveries`

## API key de pagamento

Criacao/alteracao de entrega com `price` nas rotas legadas de pagamento exige `x-api-key`.

Respostas esperadas:

- Sem API key: `401`.
- API key invalida: `403`.
- API key valida: fluxo normal.

## Formato de erro

Formato alvo:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Recurso nao encontrado.",
    "requestId": "uuid",
    "details": {}
  }
}
```

Nem todos os controllers legados seguem integralmente esse formato. Novas rotas devem seguir.

## LogiPeople modulos principais

Base local: `http://localhost:3433/api/v1`.

Rotas presentes no checkout:

- `GET/POST /people`
- `GET/POST /organization/*`
- `GET/POST /recruitment/*`
- `GET/POST /onboarding/*`
- `GET/POST /time-attendance/*`
- `GET/POST /payroll/*`
- `GET/POST /benefits/*`
- `GET/POST /absence-vacation/*`
- `GET /analytics/overview`

## LogiPeople holerites demonstrativos

- `GET /payslips`
- `POST /payslips`
- `GET /payslips/lines`

`POST /payslips` aceita:

```json
{
  "payrollRunId": "uuid",
  "reason": "Generate demonstrative payroll evidence"
}
```

Regras:

- requer JWT LogiPeople e roles `PEOPLE_ADMIN` ou `PAYROLL_MANAGER`;
- cria apenas registro demonstrativo restrito;
- `visibleToEmployee` permanece `false`;
- `legalValidationPending` permanece `true`;
- a operacao e idempotente por `payrollRunId`;
- folha fechada exige reabertura auditada antes de gerar novo demonstrativo.

## LogiDesk

Base local: `http://localhost:3533/api/v1`.

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
- `GET /reports/summary`
- `GET /dead-letter-events`
- `POST /dead-letter-events/:id/reprocess`
- `POST /tickets/:id/assign`
- `DELETE /tickets/:id/assign`
- `POST /tickets/:id/change-team`
- `GET /tickets/:id/assignments`
- `GET/POST /teams`
- `PATCH/DELETE /teams/:id`
- `GET/POST /categories`
- `PATCH/DELETE /categories/:id`
- `GET/POST /tags`
- `PATCH/DELETE /tags/:id`

`POST /tickets/from-logiflow` exige headers:

- `x-service-token`
- `idempotency-key`

As rotas administrativas de DLQ aceitam `x-service-token` ou JWT Identity com role `ADMIN`/`SUPPORT`.

Mutacoes operacionais e administrativas do LogiDesk podem exigir JWT Identity quando `LOGIDESK_REQUIRE_REST_AUTH=true`. Este modo cobre criacao/edicao de chamados, status, prioridade, atribuicoes, notas internas, anexos, preferencias de notificacao e catalogos. Notificacoes, configuracoes e acoes do detalhe do ticket no web ja usam Client Components com `Authorization`. O modo permanece desligado por padrao enquanto as leituras server-side autenticadas ainda nao forem concluidas.

`POST /tickets/:id/attachments` registra metadados auditados do anexo. Campos aceitos: `fileName`, `contentType`, `sizeBytes`, `url`, `storageKey`, `uploadedById` e `correlationId`. A API rejeita URL sem HTTPS, path traversal no nome, tamanho acima de 25 MB, MIME fora da allowlist e extensao incompativel com o MIME. O upload fisico do arquivo ainda deve ser feito por storage externo ate a fase de object storage seguro.

`GET /notifications` lista notificacoes internas e aceita `userId`, `teamId` e `unread=true`. `PATCH /notifications/:id/read` marca a notificacao como lida.

`GET /reports/summary` retorna totais e distribuicoes agregadas de chamados, origem, prioridade e SLA para dashboards operacionais. A rota nao retorna mensagens, notas internas, anexos ou dados pessoais detalhados.

Socket.IO:

- path: `/socket.io`;
- token Identity em `handshake.auth.token` ou `Authorization`;
- rooms automaticas: `user:{userId}`, `role:{role}` e `support` para `SUPPORT`/`ADMIN`;
- room dinamica: `ticket:{ticketId}` via `ticket:join`, validada por existencia do ticket, roles `ADMIN`/`SUPPORT`, solicitante, responsavel ou membro ativo da equipe;
- eventos backend atuais: `notification:created`, `ticket:created`, `ticket:updated`, `ticket:assigned` e `ticket:message:created`.

O LogiDesk web possui `/login`, tenta refresh por cookie HttpOnly quando nao ha access token em `sessionStorage`, injeta `Authorization` em chamadas REST no browser, repete uma vez apos `401`, consome `notification:created` globalmente e assina `ticket:{ticketId}` na tela `/tickets/[id]`.

`GET /dead-letter-events` lista ate 100 eventos em DLQ, ordenados por criacao decrescente. Aceita filtro `correlationId`.

`POST /dead-letter-events/:id/reprocess` recoloca o `OutboxEvent` vinculado em `PENDING`, zera `attempts`, limpa `lastError`/`processedAt` e registra auditoria `dead_letter.reprocess_requested`. O registro de DLQ permanece como evidencia historica. A operacao rejeita evento sem outbox vinculado ou outbox que nao esteja mais em `DEAD_LETTER`.

Payload:

```json
{
  "deliveryId": "uuid",
  "occurrenceId": "uuid",
  "subject": "Entrega com atraso",
  "description": "Motorista reportou bloqueio.",
  "priority": "HIGH",
  "requesterEmail": "cliente@empresa.com",
  "correlationId": "uuid"
}
```
