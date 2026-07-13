# API

## Base URLs locais

- LogiFlow API: `http://localhost:3333`
- LogiPeople API: `http://localhost:3433/api/v1`

## LogiFlow health

- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`
- `GET /api/v1/metrics`

## LogiFlow auth v1

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

## LogiFlow motorista

- `GET /api/v1/driver/me`
- `GET /api/v1/driver/deliveries`
- `GET /api/v1/driver/deliveries/:id`
- `PATCH /api/v1/driver/deliveries/:id/status`

## LogiFlow operacao

- `GET /api/v1/dashboard/metrics`
- `GET /api/v1/operations/deliveries`
- `GET /api/v1/operations/deliveries/:id/timeline`
- `PATCH /api/v1/operations/deliveries/:id/status`
- `POST /api/v1/operations/deliveries/:id/occurrences`
- `POST /api/v1/operations/deliveries/:id/proofs`
- `PATCH /api/v1/operations/occurrences/:id`
- `POST /api/v1/operations/occurrences/:id/reprocess`

## Rotas legadas LogiFlow

Continuam ativas e depreciadas:

- `POST /login`
- `POST /users`
- `GET/POST/PUT/DELETE/PATCH /drivers`
- `GET/POST/PUT/DELETE/PATCH /vehicles`
- `GET/POST/PUT/DELETE/PATCH /deliveries`

## API key de pagamento

Criacao/alteracao de entrega com `price` nas rotas legadas de pagamento exige `x-api-key`.

Respostas esperadas:

- Sem API key: `401`.
- API key invalida: `403`.
- API key valida: fluxo normal.

## Formato de erro

Formato alvo:

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Recurso nao encontrado.",
    "requestId": "uuid",
    "details": {}
  }
}
```

Nem todos os controllers legados seguem integralmente esse formato. Novas rotas devem seguir.

## LogiPeople modulos principais

Base local: `http://localhost:3433/api/v1`.

Rotas presentes no checkout:

- `GET/POST /people`
- `GET/POST /organization/*`
- `GET/POST /recruitment/*`
- `GET/POST /onboarding/*`
- `GET/POST /time-attendance/*`
- `GET/POST /payroll/*`
- `GET/POST /benefits/*`
- `GET/POST /absence-vacation/*`
- `GET /analytics/overview`

## LogiPeople holerites demonstrativos

- `GET /payslips`
- `POST /payslips`
- `GET /payslips/lines`

`POST /payslips` aceita:

```json
{
  "payrollRunId": "uuid",
  "reason": "Generate demonstrative payroll evidence"
}
```

Regras:

- requer JWT LogiPeople e roles `PEOPLE_ADMIN` ou `PAYROLL_MANAGER`;
- cria apenas registro demonstrativo restrito;
- `visibleToEmployee` permanece `false`;
- `legalValidationPending` permanece `true`;
- a operacao e idempotente por `payrollRunId`;
- folha fechada exige reabertura auditada antes de gerar novo demonstrativo.
