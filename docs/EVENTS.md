# Events

## Estado atual

Eventos versionados estao preparados em `packages/event-contracts`. O LogiFlow agora possui tabela `OutboxEvent` e `DeadLetterEvent`, e os workers LogiFlow/LogiDesk sobem com BullMQ e Redis. O dispatcher completo de outbox, retry persistente e DLQ operacional ainda nao esta finalizado.

## Eventos alvo LogiFlow

- `delivery:created`
- `delivery:assigned`
- `delivery:status:updated`
- `driver:location:updated`
- `occurrence:created`
- `occurrence:updated`
- `occurrence:integration:updated`
- `dashboard:updated`

## Eventos alvo LogiDesk

- `ticket:created`
- `ticket:updated`
- `ticket:assigned`
- `ticket:message:created`
- `ticket:note:created`
- `ticket:sla:warning`
- `ticket:sla:breached`
- `notification:created`

## Schemas implementados

- `logiflowOccurrenceEscalatedEventSchema`
- `logideskTicketCreatedEventSchema`
- `logideskTicketUpdatedEventSchema`

## Envelope recomendado

```json
{
  "eventId": "uuid",
  "eventType": "delivery:status:updated",
  "eventVersion": 1,
  "correlationId": "uuid",
  "causationId": "uuid",
  "producer": "logiflow-api",
  "occurredAt": "2026-07-13T00:00:00.000Z",
  "payload": {}
}
```

## Regras obrigatorias

- Todo evento deve ter schema Zod.
- Toda publicacao deve ser idempotente.
- Toda falha permanente deve ir para DLQ.
- Reprocessamento deve exigir permissao operacional ou administrativa.
