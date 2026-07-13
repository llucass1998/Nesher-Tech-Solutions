# Current State

Data: 2026-07-13

## Resumo

O checkout atual nao corresponde integralmente ao prompt mestre original. O prompt descreve `apps/logiflow-*` e `apps/logidesk-*`, mas este repositorio contem:

- LogiFlow legado modernizado na raiz.
- LogiPeople como produto modular dentro de `apps/`.
- LogiDesk como fundacao operacional em `apps/logidesk-*`.

As fases 1-13 do fluxo principal foram implementadas no escopo real do checkout. A execucao atual adicionou a fundacao LogiDesk, workers, Redis/Outbox estrutural e Docker integrado.

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
- Socket.IO autenticado.
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

- SSO/JWKS real ainda nao esta conectado.
- Socket.IO autenticado e processamento completo dos workers ainda precisam evoluir.
- E2E completo LogiFlow/LogiDesk ainda nao existe.

## Infraestrutura

- Docker Compose existe para LogiFlow, LogiDesk, Redis e workers.
- GitHub Actions existem para LogiFlow, LogiDesk, LogiPeople e integracao/plataforma.
- `.env.example` contem placeholders e nao segredos reais.

## Validacoes recentes

- `npm audit`: PASS, 0 vulnerabilidades.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS.
- `npm run build`: PASS.
- Docker Compose integrado LogiFlow/LogiDesk/Redis subiu com health checks.
- Smoke test idempotente de ticket LogiDesk retornou `LD-000001` sem duplicar.
