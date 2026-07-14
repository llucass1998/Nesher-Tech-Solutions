# Authentication

## LogiIdentity

LogiIdentity e a fonte nova de autenticacao da plataforma.

Endpoints:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/auth/sessions`
- `DELETE /api/v1/auth/sessions/:id`
- `DELETE /api/v1/auth/sessions`
- `GET /.well-known/jwks.json`

Modelo:

- `User`, `Credential`, `Role`, `Permission`, `Application` e `RefreshSession`.
- `IdentityExternalReference` registra vinculos futuros com IDs legados de outros sistemas.

Sessao:

- Access token JWT RS256 curto.
- Refresh token opaco em cookie HttpOnly.
- Refresh token persistido somente como hash.
- Refresh rotativo revoga a sessao anterior.
- Logout revoga a sessao de refresh atual.

Claims principais:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "name": "Nome",
  "roles": ["OPERATOR"],
  "permissions": ["logiflow.delivery.read.own"],
  "aud": ["logiflow", "logidesk"],
  "iss": "logiidentity",
  "sessionId": "session-id"
}
```

## LogiFlow v1

Endpoints versionados:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Fonte de identidade:

- `User` e a fonte principal para autenticacao versionada.
- `DriverProfile` liga usuarios motorista ao `Driver` legado.
- `RefreshSession` armazena sessoes de refresh token com hash.
- Quando `IDENTITY_JWKS_URL` esta configurada, a API tambem aceita tokens emitidos pelo LogiIdentity via JWKS.

## Tokens locais LogiFlow

- Access token: JWT curto.
- Refresh token: cookie `HttpOnly`.
- Hash de refresh token: salvo em `RefreshSession.tokenHash`.
- Logout revoga a sessao.

Claims relevantes:

```json
{
  "sub": "user-id",
  "email": "user@example.com",
  "role": "DRIVER",
  "iss": "logiflow-identity",
  "aud": ["logiflow", "logidesk"]
}
```

## Rotas legadas

Rotas como `/login`, `/users`, `/drivers`, `/vehicles` e `/deliveries` continuam ativas por compatibilidade, mas sao depreciadas. Elas devem emitir headers de depreciacao e nao devem receber novas regras duplicadas quando houver endpoint v1 equivalente.

## LogiPeople

LogiPeople valida identidade via guards NestJS:

- JWT guard.
- RBAC guard.
- ABAC guard.
- Field access guard.

O token e tratado como fronteira de integracao com LogiIdentity. O produto nao deve criar uma segunda fonte de senha independente.

## LogiDesk

LogiDesk valida tokens emitidos pelo Identity via:

- `GET /api/v1/auth/me`
- `IDENTITY_JWKS_URL`
- `IDENTITY_ISSUER`
- `IDENTITY_AUDIENCE`

O LogiDesk web agora possui `/login` apontando para `NEXT_PUBLIC_IDENTITY_API_URL`.

Fluxo atual:

1. `POST /api/v1/auth/login` no Identity com `credentials: include`.
2. Identity emite refresh token em cookie HttpOnly.
3. LogiDesk web guarda o access token em `sessionStorage` como `logiidentity.accessToken` e `logidesk.accessToken`.
4. Socket.IO usa o access token da sessao para autenticar notificacoes e rooms de ticket.

O web tambem tenta `POST /api/v1/auth/refresh` com `credentials: include` quando nao ha access token em `sessionStorage`. O logout web chama `POST /api/v1/auth/logout`, limpa a sessao local e redireciona para `/login`.

O helper REST do LogiDesk web injeta `Authorization: Bearer <accessToken>` em chamadas executadas no browser. Se a API responder `401`, ele tenta refresh uma unica vez e repete a chamada original com o novo access token.

O LogiDesk API possui um modo de transicao para RBAC REST por Identity. Quando `LOGIDESK_REQUIRE_REST_AUTH=true`, mutacoes operacionais e administrativas exigem JWT Identity com roles permitidas. O modo fica desligado por padrao para nao quebrar as paginas server-side e server actions atuais do LogiDesk web enquanto elas ainda nao conseguem ler a sessao do navegador no servidor.

Ainda pendente: migrar as chamadas server-side do LogiDesk web para uma estrategia autenticada de BFF/cookies, ligar `LOGIDESK_REQUIRE_REST_AUTH=true` por padrao, aplicar ownership fino em todas as rotas REST e validar o fluxo em E2E de browser.

## Regras

- Nunca retornar `password`, `passwordHash`, `refreshTokenHash`, chaves privadas ou secrets.
- Nunca confiar em `driverId` enviado pelo frontend para autorizacao.
- Public register nao deve aceitar roles administrativas livres.
- Segredos de JWT devem vir de variaveis de ambiente.
- Nunca registrar access token, refresh token, chave privada ou cookie de sessao em logs.
