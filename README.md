# LogiFlow Platform

Plataforma em monorepo para operacao logistica, base de suporte futura e modulos corporativos de pessoas.

O checkout atual contem:

- **LogiFlow legado modernizado** na raiz: Next.js App Router em `app/`, API Express em `src/`, banco Prisma em `prisma/`.
- **LogiPeople** em `apps/logipeople-*`: NestJS API, Next.js web, worker, pacotes compartilhados e Prisma separado em `databases/logipeople`.
- **LogiDesk** documentado como bloqueado: nao existe implementacao `apps/logidesk-*` neste checkout.

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
packages/auth                Tipos e fronteiras de identidade
packages/contracts           Contratos Zod HTTP
packages/event-contracts     Contratos Zod de eventos
packages/logger              Logger compartilhado
packages/ui                  Componentes UI compartilhados LogiFlow
databases/logipeople         Banco LogiPeople
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
npm run logipeople:prisma:generate
```

Prisma LogiFlow:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:deploy
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

## Docker LogiFlow

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
```

## Estado das fases

LogiFlow tem auth v1, ownership de motorista, rotas legadas depreciadas, dashboard operacional, endpoints operacionais, observabilidade, Docker e CI/CD.

LogiPeople possui fundacoes de organizacao, pessoas, recrutamento, onboarding, ponto, folha preliminar, beneficios, ausencias/ferias e analytics agregado.

LogiDesk, Redis/BullMQ, Outbox/DLQ reais, Socket.IO autenticado e E2E Playwright completo seguem pendentes porque a base correspondente nao existe neste checkout.

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
