# Troubleshooting

## `docker compose config` falha pedindo segredo

Comportamento esperado. Defina:

```bash
LOGIFLOW_DB_PASSWORD=...
JWT_SECRET=...
PAYMENTS_API_KEY=...
```

## Porta 3333 ocupada

Use portas alternativas:

```bash
LOGIFLOW_API_PORT=3335 LOGIFLOW_WEB_PORT=3005 LOGIFLOW_DB_PORT=5435 docker compose up -d
```

## `logiflow-migrate` falha

Verifique:

```bash
docker compose logs --tail=200 logiflow-migrate
```

Se a falha envolver schema antigo, confirme se migrations recentes estao no checkout e se o volume de teste pode ser recriado.

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

## LogiDesk nao encontrado

Nao e falha de build. A base LogiDesk nao existe neste checkout. Ver `docs/LOGIDESK.md`.
