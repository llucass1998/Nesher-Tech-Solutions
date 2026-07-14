# LogiFlow Platform

Plataforma em monorepo para operacao logistica, base de suporte futura e modulos corporativos de pessoas.

O checkout atual contem:

- **LogiFlow legado modernizado** na raiz: Next.js App Router em `app/`, API Express em `src/`, banco Prisma em `prisma/`.
- **LogiIdentity** em `apps/identity-*`: NestJS API, worker, JWT RS256/JWKS, sessoes e Prisma separado em `databases/identity`.
- **LogiPeople** em `apps/logipeople-*`: NestJS API, Next.js web, worker, pacotes compartilhados e Prisma separado em `databases/logipeople`.
- **LogiDesk** em `apps/logidesk-*`: NestJS API, Next.js web, worker BullMQ e Prisma separado em `databases/logidesk`.

## Stack

- Node.js 24
- TypeScript
- Next.js 16 App Router
- React 19
- Express 5
- NestJS 11 nos apps LogiPeople
- Prisma 7
- PostgreSQL
- Docker Compose
- Vitest
- ESLint
- GitHub Actions

## Estrutura

```text
app/                         LogiFlow web legado
src/                         LogiFlow API Express
prisma/                      Banco LogiFlow
apps/logipeople-api          LogiPeople API NestJS
apps/logipeople-web          LogiPeople web Next.js
apps/logipeople-worker       Worker LogiPeople
apps/logidesk-api            LogiDesk API NestJS
apps/logidesk-web            LogiDesk web Next.js
apps/logidesk-worker         Worker LogiDesk BullMQ
apps/logiflow-worker         Worker LogiFlow BullMQ
apps/identity-api            LogiIdentity API NestJS
apps/identity-worker         Worker LogiIdentity
packages/auth                Tipos e fronteiras de identidade
packages/contracts           Contratos Zod HTTP
packages/event-contracts     Contratos Zod de eventos
packages/logger              Logger compartilhado
packages/ui                  Componentes UI compartilhados LogiFlow
databases/logipeople         Banco LogiPeople
databases/logidesk           Banco LogiDesk
databases/identity           Banco Identity
docs/                        Documentacao de arquitetura, operacao e decisoes
```

## Comandos principais

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
npm audit
```

Workspaces:

```bash
npm run lint:workspaces
npm run test:workspaces
npm run build:workspaces
npm run identity:prisma:generate
npm run logipeople:prisma:generate
npm run logidesk:prisma:generate
```

Prisma LogiFlow:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
```

Prisma Identity:

```bash
npm run identity:prisma:generate
npm run identity:prisma:migrate
```

## Desenvolvimento local

Copie `.env.example` para `.env` e configure valores reais:

```bash
cp .env.example .env
```

LogiFlow:

```bash
npm run dev
npm run dev:api
```

LogiPeople:

```bash
npm run logipeople:dev:web
npm run logipeople:dev:api
npm run logipeople:dev:worker
```

LogiDesk:

```bash
npm run logidesk:dev:web
npm run logidesk:dev:api
npm run logidesk:dev:worker
```

LogiIdentity:

```bash
npm run identity:dev:api
npm run identity:dev:worker
```

## Docker

O Compose exige segredos por variavel de ambiente. Com `.env` configurado:

```bash
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

Health checks:

```bash
curl -i http://localhost:3333/api/v1/health/live
curl -i http://localhost:3333/api/v1/health/ready
curl -i http://localhost:3533/api/v1/health/live
curl -i http://localhost:3533/api/v1/health/ready
```

## Estado das fases

LogiFlow tem auth v1, ownership de motorista, rotas legadas depreciadas, dashboard operacional, endpoints operacionais, observabilidade, Docker e CI/CD.

LogiPeople possui fundacoes de organizacao, pessoas, recrutamento, onboarding, ponto, folha preliminar, beneficios, ausencias/ferias e analytics agregado.

LogiDesk possui fundacao operacional com tickets, SLA preliminar, outbox, DLQ, worker, web, login/refresh/logout Identity inicial, helper REST autenticado no browser e Socket.IO autenticado com consumo inicial de notificacoes no frontend. Processamento completo de workers, guards REST completos na API e E2E Playwright completo ainda seguem pendentes.

## Documentacao

Comece por:

- `docs/CURRENT_STATE.md`
- `docs/ARCHITECTURE.md`
- `docs/API.md`
- `docs/AUTHENTICATION.md`
- `docs/AUTHORIZATION.md`
- `docs/DEPLOYMENT.md`
- `docs/TESTING.md`
- `docs/TROUBLESHOOTING.md`

## Guardrails

- Nunca commitar segredos reais.
- Nunca alterar contrato publico sem versionar ou documentar compatibilidade.
- Nunca marcar integracao como pronta apenas por HTTP 200.
- Toda mudanca relevante deve passar por lint, typecheck, testes, build e audit.
- `npm audit` deve ficar com 0 vulnerabilidades, salvo excecao documentada e aprovada.
