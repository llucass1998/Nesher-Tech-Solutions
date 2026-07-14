# LogiIdentity

Data: 2026-07-14

## Escopo implementado

O LogiIdentity foi criado como servico separado para autenticar a plataforma e emitir tokens aceitos por LogiFlow e LogiDesk.

Componentes:

- `apps/identity-api`: API NestJS de autenticacao, sessoes, usuarios, roles, permissoes, aplicacoes e JWKS.
- `apps/identity-worker`: worker bootstrap conectado ao Redis.
- `databases/identity`: schema Prisma e migration inicial.
- `Dockerfile.identity-api`: imagem multi-stage para API e migration one-shot.

## Endpoints

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/:id`
- `DELETE /api/v1/auth/sessions`
- `GET /.well-known/jwks.json`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/:id`
- `PATCH /api/v1/users/:id/status`
- `DELETE /api/v1/users/:id`
- `GET /api/v1/roles`
- `POST /api/v1/roles`
- `PATCH /api/v1/roles/:id`
- `GET /api/v1/permissions`
- `GET /api/v1/applications`
- `POST /api/v1/applications`

## Token e sessao

- Access token JWT RS256 com `kid`, `iss=logiidentity`, `aud`, `sub`, `roles`, `permissions` e `sessionId`.
- Refresh token opaco em cookie HttpOnly.
- Refresh token armazenado como hash SHA-256.
- Refresh rotativo: a sessao anterior e revogada e substituida.
- Logout revoga a sessao de refresh atual.
- JWKS publica a chave publica ativa.

## Integracao atual

LogiFlow e LogiDesk validam tokens emitidos pelo Identity via `IDENTITY_JWKS_URL`.

Fallback:

- LogiFlow mantem validacao local quando `IDENTITY_JWKS_URL` nao esta configurada, para preservar consumidores atuais durante a migracao.
- LogiDesk expõe `GET /api/v1/auth/me` para validar token Identity.

## Pendencias

- Importacao automatica de usuarios legados para `IdentityExternalReference` já conta com script base criado (`apps/identity-api/src/scripts/migrate-users.ts`).
- Frontends de LogiFlow e LogiDesk integrados no código client para Login unificado.
- Guards administrativos nos endpoints de usuarios, roles e aplicacoes.
- Rate limiting e bloqueio progressivo por brute force.
- Rotacao persistida de chaves em banco.
- Revogacao de access token por `jti`.
- Autenticacao service-to-service completa para `ServiceAccount`.
- Migracao completa do LogiFlow Frontend para refresh transparente de cookie (atualmente interceptando e-mail/senha pro LogiIdentity, mas guardando AccessToken no LocalStorage em modelo transicional). LogiDesk Web 100% SSO.

## Validacao

Evidencias de 2026-07-14:

- `npm run typecheck -w identity-api`: PASS.
- `npm run typecheck -w identity-worker`: PASS.
- `npm run test -w identity-api`: PASS, 1 teste.
- `npm test`: PASS, 40 testes.
- `npm run test:workspaces`: PASS, 61 testes nos workspaces com suite.
- `npm run build:workspaces`: PASS.
- `docker compose build identity-migrate identity-api identity-worker logiflow-api logidesk-api`: PASS.
- `docker compose up -d`: PASS com `identity-api`, `identity-db`, `logiflow-api`, `logidesk-api`, webs, workers e Redis saudaveis.
- Smoke test: login, refresh, logout, JWKS, `LogiFlow /api/v1/auth/me` e `LogiDesk /api/v1/auth/me`: PASS.
