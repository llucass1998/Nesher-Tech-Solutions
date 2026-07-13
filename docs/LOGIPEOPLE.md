# LogiPeople

## Escopo

LogiPeople e o produto de RH/Departamento Pessoal presente neste checkout.

Apps:

- `apps/logipeople-api`
- `apps/logipeople-web`
- `apps/logipeople-worker`

Banco:

- `databases/logipeople`

Pacotes compartilhados:

- `packages/auth`
- `packages/contracts`
- `packages/event-contracts`
- `packages/config`
- `packages/logger`

## Dominios implementados

- Identidade e permissoes.
- Organizacao.
- Core People.
- Recrutamento preliminar.
- Onboarding preliminar.
- Ponto e frequencia preliminar.
- Folha preliminar.
- Holerites demonstrativos preliminares.
- Beneficios preliminares.
- Ausencias e ferias preliminares.
- Analytics agregado.

## Guardrails

- Dados de DP sao sensiveis.
- Analytics e agregado e preliminar.
- Nada deve disparar decisao legal, folha, beneficio, contratacao, desligamento ou eSocial sem validacao humana e juridica.
- LogiPeople nao deve acessar diretamente o banco do LogiFlow.

## Comandos

```bash
npm run logipeople:prisma:generate
npm run logipeople:dev:api
npm run logipeople:dev:web
npm run logipeople:dev:worker
npm run test -w logipeople-api
npm run build -w logipeople-web
```

## API

Base local:

```text
http://localhost:3433/api/v1
```

Rotas sao organizadas por modulos NestJS. Consulte `apps/logipeople-api/src/modules`.

## Web

Base local:

```text
http://localhost:3400
```

Paginas atuais incluem:

- pessoas;
- recrutamento;
- onboarding;
- analytics;
- organizacao;
- ponto;
- ausencias/ferias;
- folha;
- holerites;
- beneficios;
- configuracoes.
