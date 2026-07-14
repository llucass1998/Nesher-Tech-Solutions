# Deployment

## Docker local LogiFlow

Configure `.env` a partir de `.env.example`.

Comandos:

```bash
docker compose config
docker compose build
docker compose up -d
docker compose ps
```

Health:

```bash
curl -i http://localhost:3333/api/v1/health/live
curl -i http://localhost:3333/api/v1/health/ready
```

Logs:

```bash
docker compose logs --tail=200 logiflow-api
docker compose logs --tail=200 logiflow-migrate
docker compose logs --tail=200 logiflow-web
docker compose logs --tail=200 logiflow-db
```

## Migration gate

`logiflow-api` depende de `logiflow-migrate` concluir com sucesso. A API nao deve subir se `prisma migrate deploy` falhar.

## Variaveis sensiveis

Obrigatorias no Compose:

- `LOGIFLOW_DB_PASSWORD`
- `JWT_SECRET`
- `PAYMENTS_API_KEY`

Identity:

- `IDENTITY_WEB_ORIGIN` aceita uma ou mais origens separadas por virgula para CORS com credenciais.
- `NEXT_PUBLIC_IDENTITY_API_URL` aponta os frontends para o Identity API.

## CI/CD

Workflows:

- LogiFlow CI.
- LogiPeople CI.
- Platform Integration CI.

Todos usam `npm ci` e audit completo.

## Rollback

Nao ha automacao de rollback neste checkout. Antes de deploy real, documentar:

- estrategia de backup de banco;
- rollback de imagem;
- rollback de migration;
- smoke tests pos-deploy.
