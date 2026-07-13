# Authentication

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

## Tokens

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

## Regras

- Nunca retornar `password`, `passwordHash`, `refreshTokenHash`, chaves privadas ou secrets.
- Nunca confiar em `driverId` enviado pelo frontend para autorizacao.
- Public register nao deve aceitar roles administrativas livres.
- Segredos de JWT devem vir de variaveis de ambiente.
