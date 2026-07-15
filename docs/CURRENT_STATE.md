# Current State

Data: 2026-07-13

## Resumo

O checkout atual agora possui a base da Logi Platform com Identity separado e produtos ainda em estagios diferentes de maturidade. O LogiFlow continua parcialmente na raiz, enquanto LogiDesk, LogiPeople e Identity seguem a estrutura `apps/` e `databases/`.

- LogiIdentity como servico separado em `apps/identity-*` e `databases/identity`.
- LogiFlow legado modernizado na raiz.
- LogiPeople como produto modular dentro de `apps/`.
- LogiDesk como fundacao operacional em `apps/logidesk-*`.
- LogiPayroll como fundacao separada em `apps/logipayroll-*` e `databases/logipayroll`.

As fases anteriores do fluxo LogiFlow/LogiDesk continuam preservadas. A execucao atual adicionou Identity API, Identity DB, JWKS, refresh token rotativo e validacao basica de token Identity por LogiFlow e LogiDesk.

## LogiIdentity

Estrutura:

- `apps/identity-api`: API NestJS de autenticacao, sessoes, usuarios, roles, permissoes, aplicacoes e JWKS.
- `apps/identity-worker`: worker bootstrap conectado ao Redis.
- `databases/identity`: Prisma schema e migration inicial.

Implementado:

- Login, refresh, logout, `me`, lista/revogacao de sessoes.
- JWT RS256 com JWKS.
- Refresh token HttpOnly e rotativo, armazenado como hash.
- Modelos de usuario, credencial, role, permission, application, sessoes, service account, audit, outbox, inbox e referencia externa.
- Docker Compose com `identity-db`, `identity-migrate`, `identity-api` e `identity-worker`.

Limitacoes:

- Importacao automatica de usuarios legados ainda nao foi implementada.
- Endpoints administrativos ainda precisam de guards reais.
- Rate limiting, lockout progressivo e rotacao persistida de chaves ainda estao pendentes.

## LogiFlow

Estrutura:

- `app/`: web Next.js App Router.
- `src/`: API Express.
- `prisma/`: schema e migrations do banco LogiFlow.
- `packages/ui`: componentes compartilhados usados pelo LogiFlow.

Implementado:

- Auth versionada em `/api/v1/auth/*`.
- `User`, `DriverProfile` e `RefreshSession`.
- Ownership de motorista em `/api/v1/driver/*`.
- Rotas legadas depreciadas com headers e warning estruturado.
- Dashboard versionado.
- Endpoints operacionais de entregas, timeline, status, ocorrencias, comprovantes e reprocessamento.
- Health checks e metricas.
- Docker Compose com migration gate.
- CI/CD GitHub Actions.
- Audit de dependencias com 0 vulnerabilidades conhecidas.

Ainda pendente:

- Remocao definitiva das rotas legadas.
- Processamento completo de outbox/retry/DLQ nos workers.
- Socket.IO autenticado no backend do LogiDesk e consumo inicial no LogiDesk web.
- E2E Playwright completo.

## LogiPeople

Estrutura:

- `apps/logipeople-api`: NestJS API.
- `apps/logipeople-web`: Next.js App Router.
- `apps/logipeople-worker`: worker de Outbox.
- `databases/logipeople`: Prisma schema, migrations e seed.
- `packages/*`: auth, contracts, event-contracts, config e logger.

Implementado:

- Identidade e permissoes base.
- RBAC, ABAC e controle de campos.
- Organizacao e Core People.
- Recrutamento preliminar.
- Onboarding preliminar.
- Ponto e frequencia preliminar.
- Folha preliminar.
- Beneficios preliminares.
- Ausencias e ferias preliminares.
- Analytics agregados.
- Outbox inicial `logipeople.employee.hired` ao criar colaborador, validada por contrato compartilhado e limitada a `employeeId`, `personId` e `startDate`.
- Worker LogiPeople publica Outbox valida no Redis Stream `LOGIPEOPLE_EVENT_STREAM`, aplica retry/backoff e registra `DeadLetterEvent`.
- Docker Compose com `logipeople-db`, `logipeople-migrate`, `logipeople-api`, `logipeople-worker` e `logipeople-web`.

Limitacoes:

- Dados sensiveis e DP continuam preliminares.
- eSocial real, calculos legais, pagamentos, provisoes e automacoes externas nao estao implementados.
- Consumo automatico do evento `logipeople.employee.hired` pelo LogiPayroll ainda nao esta implementado.

## LogiDesk

Estrutura:

- `apps/logidesk-api`: NestJS API.
- `apps/logidesk-web`: Next.js App Router.
- `apps/logidesk-worker`: worker BullMQ.
- `databases/logidesk`: Prisma schema e migrations.

Implementado:

- Tickets, mensagens, notas internas, historico, SLA preliminar, outbox, DLQ, auditoria e health checks.
- Criacao idempotente de ticket a partir do LogiFlow.
- Web com login Identity, refresh por cookie HttpOnly, logout, guard visual de sessao, helper REST com Authorization/retry no browser, dashboard, chamados, detalhe do chamado, Kanban, SLA, notificacoes e configuracoes.

Limitacoes:

- SSO/JWKS basico conectado ao LogiIdentity por `GET /api/v1/auth/me` e login/refresh/logout inicial no LogiDesk web.
- Socket.IO autenticado ja existe no backend do LogiDesk, `ticket:join` valida acesso e o web consome notificacoes/eventos de ticket quando ha token de sessao ou refresh valido.
- O helper REST do web ja envia Authorization no browser. Notificacoes, configuracoes e acoes do detalhe do ticket ja usam mutacoes client-side autenticadas, e server actions antigas de tickets foram removidas. A API possui RBAC REST de transicao para mutacoes com `LOGIDESK_REQUIRE_REST_AUTH=true` no `.env.example`; ainda falta migrar leituras SSR para sessao autenticada, aplicar ownership fino e completar processamento dos workers.
- E2E completo LogiFlow/LogiDesk ainda nao existe.

## LogiPayroll

Estrutura:

- `apps/logipayroll-api`: NestJS API.
- `apps/logipayroll-web`: Next.js App Router.
- `apps/logipayroll-worker`: worker bootstrap.
- `databases/logipayroll`: Prisma schema e migration inicial.

Implementado:

- Health checks.
- `GET /api/v1/auth/me` validando JWT RS256 do LogiIdentity por JWKS e audience `logipayroll`.
- Endpoint `GET /api/v1/payroll/capabilities`.
- Endpoints iniciais `GET /api/v1/payroll/contracts` e `POST /api/v1/payroll/contracts` protegidos por Identity e permissao/role LogiPayroll.
- Schema separado com referencias de colaborador, contratos, payroll runs, itens, outbox e inbox.
- Criacao de contrato registra `OutboxEvent` `logipayroll.contract.created` sem salario, documento bruto, banco ou dados fiscais.
- Evento `logipayroll.contract.created` possui contrato Zod versionado em `packages/event-contracts` e e validado pela API antes da Outbox.
- Worker LogiPayroll publica Outbox valida em Redis Streams, aplica retry/backoff e registra `DeadLetterEvent` para falhas permanentes ou esgotadas.
- Worker LogiPayroll consome `logipeople.employee.hired` de `LOGIPEOPLE_EVENT_STREAM`, registra `InboxMessage`, mantem `ConsumerCheckpoint` e cria/atualiza `PayrollEmployeeReference` minima.
- Worker LogiFlow consome eventos operacionais do LogiPayroll em `LOGIPAYROLL_EVENT_STREAM` e atualiza disponibilidade de motorista quando ha `DriverProfile.employeeId` mapeado.
- Docker Compose com `logipayroll-db`, `logipayroll-migrate`, `logipayroll-api`, `logipayroll-worker` e `logipayroll-web`.
- CI dedicado `logipayroll-ci.yml`.

Limitacoes:

- Nenhum dado real foi migrado do LogiPeople.
- APIs reais de ponto, ferias, folha, holerites, testes de integracao com banco real, eventos produtores de ferias/afastamentos e criacao automatica de contrato ainda estao pendentes.

## Infraestrutura

- Docker Compose existe para Identity, LogiFlow, LogiDesk, LogiPeople, LogiPayroll, Redis e workers.
- GitHub Actions existem para Identity, LogiFlow, LogiDesk, LogiPeople, LogiPayroll e integracao/plataforma.
- `.env.example` contem placeholders e nao segredos reais.

## Validacoes recentes

- `npm audit`: PASS, 0 vulnerabilidades.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS.
- `npm run build`: PASS.
- Docker Compose integrado Identity/LogiFlow/LogiDesk/Redis subiu com health checks.
- Smoke Identity: login, refresh, logout, JWKS, validacao LogiFlow e validacao LogiDesk: PASS.
- Smoke test idempotente de ticket LogiDesk retornou `LD-000001` sem duplicar.
