# LogiPayroll

Data: 2026-07-14

## Estado atual

LogiPayroll agora possui uma fundacao separada no monorepo:

- `apps/logipayroll-api`: API NestJS com health checks e endpoint de capacidades.
- `apps/logipayroll-web`: web Next.js inicial para o produto de DP/folha.
- `apps/logipayroll-worker`: worker inicial.
- `databases/logipayroll`: schema Prisma e migration inicial.
- `Dockerfile.logipayroll-api`, `Dockerfile.logipayroll-web` e services Compose dedicados.
- `.github/workflows/logipayroll-ci.yml`: CI dedicado para o produto.

Esta etapa nao migra dados reais do LogiPeople. Ela cria a fronteira tecnica para a extracao gradual do dominio de Departamento Pessoal.

## Fronteira de dominio

LogiPayroll deve ser dono de dados restritos de folha e DP:

- contratos;
- jornada e ponto;
- ferias;
- beneficios;
- folha;
- holerites;
- eSocial;
- desligamentos.

LogiPeople pode receber apenas dados operacionais minimos, como status funcional, disponibilidade, data de inicio/fim de contrato e ferias aprovadas. Valores de folha, dados bancarios, documentos fiscais detalhados, XML eSocial e dados medicos nao devem ser enviados automaticamente para outros produtos.

## API

Base local planejada:

```text
http://localhost:3733/api/v1
```

Endpoints iniciais:

- `GET /health/live`
- `GET /health/ready`
- `GET /payroll/capabilities`

## Banco

Schema inicial:

- `PayrollEmployeeReference`
- `Contract`
- `PayrollRun`
- `PayrollItem`
- `OutboxEvent`
- `InboxMessage`

Nao existem relacoes Prisma com bancos de LogiPeople, LogiFlow ou LogiDesk.

## Validacao recente

- `npm run typecheck -w logipayroll-api`: PASS.
- `npm run typecheck -w logipayroll-worker`: PASS.
- `npm run typecheck -w logipayroll-web`: PASS.
- `npm run lint -w logipayroll-web`: PASS.
- `npm run lint -w logipayroll-worker`: PASS.
- `npm run build -w logipayroll-api`: PASS.
- `npm run build -w logipayroll-worker`: PASS.
- `npm run build -w logipayroll-web`: PASS.
- `npx prisma validate --config apps/logipayroll-api/prisma.config.ts`: PASS.
- `docker compose --env-file .env.example config`: PASS.
- `docker compose --env-file .env.example build --progress plain logipayroll-api`: PASS.
- `docker compose --env-file .env.example build --progress plain logipayroll-web`: PASS.
- `docker compose --env-file .env.example build --progress plain logipayroll-worker`: PASS.
- `docker compose --env-file .env.example build --progress plain logipayroll-migrate`: PASS.

## Pendencias

- Autenticacao Identity/JWKS na API.
- APIs reais de contratos, ponto, ferias, folha e holerites.
- Eventos `logipayroll.*` em `packages/event-contracts`.
- Integracao LogiPeople -> LogiPayroll.
- Integracao LogiPayroll -> LogiFlow para indisponibilidade operacional.
- Testes unitarios, integracao e contrato.
