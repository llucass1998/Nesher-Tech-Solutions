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
- `GET /auth/me`
- `GET /payroll/capabilities`
- `GET /payroll/contracts`
- `POST /payroll/contracts`

`GET /auth/me` valida tokens RS256 emitidos pelo LogiIdentity via JWKS, exige audience `logipayroll` e retorna apenas dados publicos do usuario autenticado.

`GET /payroll/contracts` exige role `ADMIN`/`PAYROLL_ADMIN` ou permissao `logipayroll.contract.read`.

`POST /payroll/contracts` exige role `ADMIN`/`PAYROLL_ADMIN` ou permissao `logipayroll.contract.write`, cria/atualiza a referencia minima do colaborador, cria contrato e grava `OutboxEvent` `logipayroll.contract.created`. A resposta e o evento nao incluem documento bruto, salario, dados bancarios, descontos ou dados fiscais.

O payload do evento e validado pelo schema Zod compartilhado `logipayrollContractCreatedDataSchema` em `packages/event-contracts`.

## Worker

`apps/logipayroll-worker` processa a Outbox inicial:

- busca eventos `PENDING` ou `FAILED` elegiveis para retry;
- valida `logipayroll.contract.created` pelo contrato compartilhado;
- publica no Redis Stream `LOGIPAYROLL_EVENT_STREAM`;
- marca sucesso como `PROCESSED`;
- marca falha temporaria como `FAILED`;
- envia evento permanente ou esgotado para `DEAD_LETTER` e registra `DeadLetterEvent`.
- consome `logipeople.employee.hired` de `LOGIPEOPLE_EVENT_STREAM`;
- registra `InboxMessage` por `eventId` para idempotencia;
- mantem `ConsumerCheckpoint` para nao reprocessar o stream inteiro;
- cria ou atualiza `PayrollEmployeeReference` minima sem salario, documento bruto ou dados bancarios.

## Integracao LogiPeople

LogiPeople agora grava `OutboxEvent` `logipeople.employee.hired` quando um colaborador e criado. O evento contem apenas `employeeId`, `personId` e `startDate`, validado pelo contrato compartilhado.

O worker do LogiPeople publica esse evento no Redis Stream `LOGIPEOPLE_EVENT_STREAM` com retry/backoff e DLQ. O worker do LogiPayroll consome o evento, aplica Inbox/idempotencia, avanca checkpoint e cria a referencia minima do colaborador.

O mapeamento automatico para contrato ainda fica como proxima etapa, porque o evento de contratacao atual nao transporta dados contratuais suficientes para criar um `Contract` com validade juridica.

## Banco

Schema inicial:

- `PayrollEmployeeReference`
- `Contract`
- `PayrollRun`
- `PayrollItem`
- `OutboxEvent`
- `InboxMessage`
- `ConsumerCheckpoint`

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
- `npm run test -w logipayroll-api`: PASS, 10 testes.
- `npx prisma validate --config apps/logipayroll-api/prisma.config.ts`: PASS.
- `docker compose --env-file .env.example config`: PASS.
- `docker compose --env-file .env.example build --progress plain logipayroll-api`: PASS.
- `docker compose --env-file .env.example build --progress plain logipayroll-web`: PASS.
- `docker compose --env-file .env.example build --progress plain logipayroll-worker`: PASS.
- `docker compose --env-file .env.example build --progress plain logipayroll-migrate`: PASS.
- `npm run test -w logipayroll-worker`: PASS, 3 testes.

## Pendencias

- Guards de autorizacao por dominio e permissoes em endpoints reais.
- APIs reais de ponto, ferias, folha e holerites.
- Testes de integracao com banco real para contratos.
- Consumidores reais das mensagens publicadas em `logipayroll.events`.
- Eventos adicionais `logipayroll.*` para folha, holerites, desligamentos e disponibilidade.
- Criacao automatica de contrato a partir de evento LogiPeople quando houver contrato compartilhado com dados contratuais minimos.
- Integracao LogiPayroll -> LogiFlow para indisponibilidade operacional.
- Testes unitarios, integracao e contrato.
