# Current State

Data: 2026-07-12

## Resumo

O checkout atual nao corresponde integralmente ao prompt mestre. O prompt descreve um monorepo com `apps/logiflow-web`, `apps/logiflow-api`, `apps/logiflow-worker`, `apps/logidesk-web`, `apps/logidesk-api` e `apps/logidesk-worker`; esses apps nao existem neste workspace.

O repositorio possui hoje duas frentes:

- LogiFlow legado na raiz: frontend Next.js em `app/`, API Express em `src/`, banco Prisma em `prisma/`.
- LogiPeople em monorepo: `apps/logipeople-*`, `packages/*` e `databases/logipeople`, com alteracoes nao relacionadas ja presentes no working tree.

Esta execucao aplicou as Fases 1-5 somente ao LogiFlow legado da raiz, preservando LogiPeople e evitando sobrescrever alteracoes existentes.

## Estrutura encontrada

- `app/`: frontend LogiFlow legado.
- `src/`: API Express LogiFlow legada.
- `prisma/`: schema e migrations do banco LogiFlow legado.
- `apps/logipeople-api`, `apps/logipeople-web`, `apps/logipeople-worker`: modulo LogiPeople existente.
- `packages/auth`, `packages/config`, `packages/contracts`, `packages/event-contracts`, `packages/logger`: pacotes compartilhados atualmente voltados a LogiPeople.
- `databases/logipeople`: banco separado do LogiPeople.
- `.claude/skills`: skills locais para integracao segura, seguranca e E2E LogiFlow/LogiDesk.

## LogiFlow legado

Rotas atuais:

- `POST /login`
- `POST /users`
- `GET/POST/PUT/DELETE/PATCH /drivers`
- `GET/POST/PUT/DELETE/PATCH /vehicles`
- `GET/POST/PUT/DELETE/PATCH /deliveries`

Modelos atuais:

- `Driver`
- `Vehicle`
- `Delivery`

Riscos confirmados:

- Login legado autentica em `Driver.password`.
- Ainda nao existe `User` como fonte unica de identidade no schema raiz.
- Ainda nao existe `DriverProfile`.
- Endpoints versionados `/api/v1/auth/*` e `/api/v1/driver/*` ainda nao existem.
- LogiDesk operacional nao existe neste checkout.
- Nao ha arquivos relacionados a ticket, chamado, suporte, SLA, inbox, kanban ou LogiDesk.
- Docker Compose e GitHub Actions nao foram encontrados por busca filtrada.

## LogiPeople

LogiPeople ja possui NestJS, Prisma separado, guards, modulos, testes e documentacao propria. O working tree ja tinha alteracoes nao minhas em:

- `databases/logipeople/prisma/schema.prisma`
- `packages/contracts/src/index.ts`
- `apps/logipeople-api/src/modules/absence-vacation/`
- `databases/logipeople/prisma/migrations/20260712040000_absence_vacation_foundation/`

Essas alteracoes serao preservadas.

## Estado da Fase 6

A Fase 6 pede evoluir o LogiDesk operacional, mas nao ha base de LogiDesk neste workspace. Criar `apps/logidesk-*` do zero seria uma reconstrucao, contrariando a regra do prompt mestre de nao reconstruir o projeto do zero.

O estado e os pre-requisitos da Fase 6 estao documentados em `docs/LOGIDESK.md`.
