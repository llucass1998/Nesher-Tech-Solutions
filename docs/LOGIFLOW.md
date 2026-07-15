# LogiFlow

## Escopo

LogiFlow e responsavel por operacao logistica:

- motoristas;
- veiculos;
- entregas;
- status operacional;
- ocorrencias;
- comprovantes;
- dashboard;
- app/tela do motorista.

## API atual

Versionada:

- `/api/v1/auth/*`
- `/api/v1/driver/*`
- `/api/v1/dashboard/metrics`
- `/api/v1/operations/*`
- `/api/v1/health/*`
- `/api/v1/metrics`

Legada depreciada:

- `/login`
- `/users`
- `/drivers`
- `/vehicles`
- `/deliveries`
- `/dashboard/metrics`

## Banco

Principais modelos:

- `User`
- `DriverProfile`
- `RefreshSession`
- `Driver`
- `Vehicle`
- `Delivery`
- `DeliveryStatusHistory`
- `Occurrence`
- `DeliveryProof`
- `OutboxEvent`
- `DeadLetterEvent`
- `InboxMessage`
- `ConsumerCheckpoint`

## Integracao e DLQ

LogiFlow publica escalonamentos para o LogiDesk por `OutboxEvent`, processado pelo `apps/logiflow-worker`.

O worker tambem consome eventos do LogiPayroll em `LOGIPAYROLL_EVENT_STREAM`:

- `logipayroll.leave.approved`;
- `logipayroll.employee.unavailable`;
- `logipayroll.employee.available`.

O consumo registra `InboxMessage`, avanca `ConsumerCheckpoint` e atualiza `DriverProfile.status`/`Driver.status` somente quando existe mapeamento local por `DriverProfile.employeeId`. O payload operacional salvo em `DriverProfile.operationalData.payrollAvailability` nao inclui salario, documento, banco, CID ou dados medicos.

Rotas operacionais de recuperacao:

- `GET /api/v1/operations/dead-letter-events`
- `POST /api/v1/operations/dead-letter-events/:id/reprocess`

As duas exigem JWT v1 e roles `ADMIN` ou `OPERATOR`. O reprocessamento recoloca o outbox vinculado em `PENDING` e, quando o payload possui `occurrenceId`, tambem recoloca a ocorrencia em `PENDING`.

## Fluxo de entrega

```mermaid
flowchart TD
  Create[Operador cria entrega] --> Assign[Entrega vinculada a driver/vehicle]
  Assign --> DriverView[Motorista lista suas entregas]
  DriverView --> Status[Motorista atualiza status]
  Status --> History[DeliveryStatusHistory]
  Status --> Dashboard[Dashboard atualizado por consulta]
```

## Limitacoes atuais

- O worker LogiFlow existe, despacha outbox por HTTP, publica espelho operacional em Redis Stream e consome indisponibilidade operacional do LogiPayroll.
- DLQ operacional existe como endpoint inicial; falta validar reprocessamento fim a fim com containers.
- Eventos do LogiPayroll sem `DriverProfile.employeeId` mapeado sao registrados como processados e logados para saneamento cadastral, sem alterar motoristas.
- Nao ha mapa com ownership completo.
- E2E completo LogiFlow -> LogiDesk ainda nao foi automatizado.
