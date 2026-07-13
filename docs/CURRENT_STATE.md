# Current State

Data: 2026-07-13

## Resumo

O checkout atual nao corresponde integralmente ao prompt mestre original. O prompt descreve `apps/logiflow-*` e `apps/logidesk-*`, mas este repositorio contem:

- LogiFlow legado modernizado na raiz.
- LogiPeople como produto modular dentro de `apps/`.
- Nenhuma implementacao LogiDesk.

As fases 1-12 do fluxo principal foram implementadas no escopo real do checkout. A fase atual, Fase 13, consolida a documentacao.

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
- Redis, BullMQ, Outbox, DLQ e workers LogiFlow reais.
- Socket.IO autenticado.
- E2E Playwright completo.
- Integracao real com LogiDesk.

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

Nao ha `apps/logidesk-api`, `apps/logidesk-web` ou `apps/logidesk-worker`.

A Fase 6 segue bloqueada para evolucao real de produto. Ver `docs/LOGIDESK.md`.

## Infraestrutura

- Docker Compose existe para LogiFlow DB, migration, API e web.
- GitHub Actions existem para LogiFlow, LogiPeople e integracao/plataforma.
- `.env.example` contem placeholders e nao segredos reais.

## Validacoes recentes

- `npm audit`: PASS, 0 vulnerabilidades.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm test`: PASS.
- `npm run build`: PASS.
- LogiPeople web/API checks passaram na conclusao da fase Analytics.
