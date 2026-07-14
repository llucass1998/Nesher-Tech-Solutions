# Contracts

Data: 2026-07-14

## Pacotes

- `packages/contracts`: contratos HTTP e DTOs compartilhados.
- `packages/event-contracts`: contratos de eventos distribuídos.

## Estado atual

`packages/contracts` já contém contratos de LogiPeople e módulos corporativos preliminares.

`packages/event-contracts` foi consolidado como a fonte dos eventos da Logi Platform:

- LogiFlow ↔ LogiDesk;
- LogiDesk ↔ LogiPeople;
- LogiPeople ↔ LogiPayroll;
- LogiPayroll ↔ LogiFlow.

## Política de versionamento

- Todo contrato público deve ter versão explícita quando puder atravessar fronteira entre sistemas.
- Eventos usam `eventVersion`.
- APIs públicas devem usar path versionado, por exemplo `/api/v1`.
- Alterações incompatíveis exigem nova versão, não alteração silenciosa do contrato existente.
- Campos novos opcionais são permitidos quando preservam compatibilidade retroativa.
- Campos obrigatórios novos em evento existente exigem nova versão.

## Compatibilidade

Ainda existem nomes legados no código operacional:

- `logiflow.occurrence_escalated`
- `ticket.created`
- `ticket.updated`

Esses nomes devem ser migrados para:

- `logiflow.occurrence.escalated`
- `logidesk.ticket.created`
- `logidesk.ticket.status_changed` ou outro evento específico.

Durante a migração, consumidores devem aceitar os nomes antigos somente como fallback documentado e temporário.

## Segurança de dados

Contratos não devem incluir:

- senha;
- hash de senha;
- refresh token;
- chave privada;
- token de serviço;
- salário detalhado fora do LogiPayroll;
- dados bancários;
- documentos completos;
- dados médicos.

Payloads de evento em `packages/event-contracts` são estritos para impedir campos extras sensíveis.

## Validação

Executado em 2026-07-14:

- `npm run typecheck -w @logipeople/event-contracts`: PASS.
- `npm run test -w @logipeople/event-contracts`: PASS, 5 testes.
