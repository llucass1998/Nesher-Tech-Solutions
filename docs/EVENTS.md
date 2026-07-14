# Events

Data: 2026-07-14

## Estado atual

Os contratos de eventos distribuídos da plataforma estão centralizados em `packages/event-contracts`.

O pacote agora define:

- envelope padronizado;
- eventos versionados;
- nomes namespaced por produto;
- payloads estritos com Zod;
- lista tipada de `eventType`;
- helpers `parsePlatformEvent` e `safeParsePlatformEvent`.

Produtores e consumidores ainda precisam ser migrados gradualmente para usar estes schemas em runtime. Alguns pontos do LogiFlow/LogiDesk ainda emitem nomes antigos como `logiflow.occurrence_escalated` e `ticket.created`; esses nomes devem ser tratados como legados e substituídos sem quebrar filas existentes.

## Envelope

```json
{
  "eventId": "uuid",
  "eventType": "logiflow.occurrence.escalated",
  "eventVersion": 1,
  "occurredAt": "2026-07-14T03:00:00.000Z",
  "producer": "logiflow-api",
  "correlationId": "uuid",
  "causationId": "uuid",
  "idempotencyKey": "string",
  "traceparent": "00-...",
  "metadata": {},
  "data": {}
}
```

## Eventos LogiFlow

- `logiflow.occurrence.created`
- `logiflow.occurrence.escalated`
- `logiflow.occurrence.updated`
- `logiflow.delivery.delayed`
- `logiflow.delivery.failed`
- `logiflow.vehicle.maintenance_required`
- `logiflow.route.delayed`

## Eventos LogiDesk

- `logidesk.ticket.created`
- `logidesk.ticket.assigned`
- `logidesk.ticket.status_changed`
- `logidesk.ticket.priority_changed`
- `logidesk.ticket.message_created`
- `logidesk.ticket.resolved`
- `logidesk.ticket.closed`
- `logidesk.ticket.sla_warning`
- `logidesk.ticket.sla_breached`
- `logidesk.hr_case.created`
- `logidesk.hr_case.updated`
- `logidesk.onboarding_request.created`
- `logidesk.training_request.created`

## Eventos LogiPeople

- `logipeople.hr_case.created`
- `logipeople.hr_case.status_changed`
- `logipeople.employee.operational_eligibility_changed`
- `logipeople.employee.hired`
- `logipeople.employee.updated`
- `logipeople.employee.terminated`

## Eventos LogiPayroll

- `logipayroll.contract.created`
- `logipayroll.leave.approved`
- `logipayroll.employee.unavailable`
- `logipayroll.employee.available`

## Regras obrigatórias

- Todo evento publicado deve passar pelo schema Zod correspondente.
- Todo payload de evento deve ser estrito: campos não declarados devem falhar.
- Dados de folha, banco, salário, documentos completos ou dados médicos não podem atravessar eventos fora do LogiPayroll.
- Todo consumidor deve registrar `InboxMessage` ou equivalente antes de aplicar efeito colateral.
- Todo consumidor deve ser idempotente por `eventId` e, quando aplicável, `idempotencyKey`.
- Toda falha temporária deve ter retry com backoff.
- Toda falha permanente deve ir para DLQ.
- Reprocessamento deve exigir permissão operacional ou administrativa.

## Validação

Executado em 2026-07-14:

- `npm run typecheck -w @logipeople/event-contracts`: PASS.
- `npm run test -w @logipeople/event-contracts`: PASS, 5 testes.
