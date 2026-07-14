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

O SSO de frontend ainda precisa ser completado para usar refresh transparente e redirecionamento centralizado.

## Regras

- Nunca retornar `password`, `passwordHash`, `refreshTokenHash`, chaves privadas ou secrets.
- Nunca confiar em `driverId` enviado pelo frontend para autorizacao.
- Public register nao deve aceitar roles administrativas livres.
- Segredos de JWT devem vir de variaveis de ambiente.
- Nunca registrar access token, refresh token, chave privada ou cookie de sessao em logs.
