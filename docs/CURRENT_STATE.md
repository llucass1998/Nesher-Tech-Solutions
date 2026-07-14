# Current State

Data: 2026-07-13

## Resumo

O checkout atual agora possui a base da Logi Platform com Identity separado e produtos ainda em estagios diferentes de maturidade. O LogiFlow continua parcialmente na raiz, enquanto LogiDesk, LogiPeople e Identity seguem a estrutura `apps/` e `databases/`.

- LogiIdentity como servico separado em `apps/identity-*` e `databases/identity`.
- LogiFlow legado modernizado na raiz.
- LogiPeople como produto modular dentro de `apps/`.
- LogiDesk como fundacao operacional em `apps/logidesk-*`.

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
- Socket.IO autenticado no backend do LogiDesk.
- E2E Playwright completo.

## LogiPeople

Estrutura:

- `apps/logipeople-api`: NestJS API.
- `apps/logipeople-web`: Next.js App Router.
- `apps/logipeople-worker`: worker bootstrap.
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

Limitacoes:

- Dados sensiveis e DP continuam preliminares.
- eSocial real, calculos legais, pagamentos, provisoes e automacoes externas nao estao implementados.

## LogiDesk

Estrutura:

- `apps/logidesk-api`: NestJS API.
- `apps/logidesk-web`: Next.js App Router.
- `apps/logidesk-worker`: worker BullMQ.
- `databases/logidesk`: Prisma schema e migrations.

Implementado:

- Tickets, mensagens, notas internas, historico, SLA preliminar, outbox, DLQ, auditoria e health checks.
- Criacao idempotente de ticket a partir do LogiFlow.
- Web com dashboard, chamados, Kanban, SLA e configuracoes.

Limitacoes:

- SSO/JWKS basico conectado ao LogiIdentity por `GET /api/v1/auth/me`.
- Socket.IO autenticado ja existe no backend do LogiDesk, mas consumo frontend e processamento completo dos workers ainda precisam evoluir.
- E2E completo LogiFlow/LogiDesk ainda nao existe.

## Infraestrutura

- Docker Compose existe para Identity, LogiFlow, LogiDesk, Redis e workers.
- GitHub Actions existem para Identity, LogiFlow, LogiDesk, LogiPeople e integracao/plataforma.
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
