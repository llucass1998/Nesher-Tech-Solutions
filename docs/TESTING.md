# Testing

## Comandos

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run lint:workspaces
npm run test:workspaces
npm run build:workspaces
npm audit
```

## Cobertura atual

LogiFlow:

- Regressao de rotas legadas.
- API key de pagamentos.
- Auth v1.
- Ownership de motorista.
- Operacoes LogiFlow.
- Observabilidade.

LogiPeople:

- Guards de autenticacao/autorizacao.
- Modulos de dominios implementados.
- Analytics agregado.

LogiDesk:

- Tickets service-to-service com token de servico.
- Idempotencia por `idempotency-key`.
- Criacao de historico, SLA preliminar, auditoria e outbox.
- Typecheck e build da API/web/workers.

## O que testar em toda feature nova

- Caminho feliz.
- Payload invalido.
- Autenticacao ausente.
- Autorizacao incorreta.
- Ownership quando houver recurso de usuario.
- Regressao de contrato publico.
- Logs sem segredos.

## Pendencias

- Testes de contrato LogiFlow/LogiDesk.
- Testes completos de Redis/BullMQ/Outbox/DLQ com falha, retry e reprocessamento.
- Playwright E2E completo.
- Smoke test de deploy real.
