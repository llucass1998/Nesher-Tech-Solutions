# Troubleshooting

## `docker compose config` falha pedindo segredo

Comportamento esperado. Defina:

```bash
LOGIFLOW_DB_PASSWORD=...
LOGIDESK_DB_PASSWORD=...
JWT_SECRET=...
PAYMENTS_API_KEY=...
LOGIDESK_SERVICE_TOKEN=...
```

## Porta 3333 ocupada

Use portas alternativas:

```bash
LOGIFLOW_API_PORT=3335 LOGIFLOW_WEB_PORT=3005 LOGIFLOW_DB_PORT=5435 LOGIDESK_API_PORT=3535 LOGIDESK_WEB_PORT=3505 LOGIDESK_DB_PORT=5436 REDIS_PORT=6380 docker compose up -d
```

## `logiflow-migrate` falha

Verifique:

```bash
docker compose logs --tail=200 logiflow-migrate
```

Se a falha envolver schema antigo, confirme se migrations recentes estao no checkout e se o volume de teste pode ser recriado.

## `logidesk-api` fica unhealthy

Verifique primeiro:

```bash
docker compose logs --tail=200 logidesk-api
docker compose logs --tail=200 logidesk-migrate
```

Causas ja encontradas e corrigidas:

- entrypoint Docker apontando para `dist/main.js` em vez de `dist/src/main.js`;
- Prisma Client gerado copiado para caminho incorreto;
- Prisma 7 exigindo `@prisma/adapter-pg` com `LOGIDESK_DATABASE_URL`.

## API ready retorna 503

Possiveis causas:

- banco indisponivel;
- `DATABASE_URL` incorreta;
- migration nao aplicada;
- container DB ainda iniciando.

## `npm audit` falha

O projeto exige 0 vulnerabilidades conhecidas. Corrija com upgrade/override controlado e valide:

```bash
npm audit
npm ls postcss @hono/node-server prisma next
```

## Next.js avisa sobre multiple lockfiles

Aviso conhecido no ambiente atual. O projeto usa `npm` e `package-lock.json`; `pnpm-workspace.yaml` tambem existe por historico do monorepo.

## LogiDesk incompleto

Nao e falha de build. A fundacao LogiDesk existe, mas o produto empresarial completo ainda nao inclui SSO frontend real, tela de detalhe assinando rooms de Socket.IO, E2E completo, SLA avancado, anexos binarios e dispatcher completo de outbox/DLQ. Ver `docs/LOGIDESK.md`.
