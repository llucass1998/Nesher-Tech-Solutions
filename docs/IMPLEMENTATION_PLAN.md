# Implementation Plan

## Escopo desta execucao

Implementar apenas:

1. Fase 1 - Diagnostico e testes de regressao.
2. Fase 2 - Consolidacao gradual de `User` e `DriverProfile`.
3. Fase 3 - Autenticacao versionada em `/api/v1/auth/*`.
4. Fase 4 - Ownership do motorista em `/api/v1/driver/*`.
5. Fase 5 - Depreciacao controlada das rotas legadas.
6. Fase 7 - Primeiro incremento operacional do LogiFlow.

## Ajuste de escopo por estado real

Como `apps/logiflow-*` e `apps/logidesk-*` nao existem, as mudancas serao aplicadas ao LogiFlow legado:

- API Express em `src/`.
- Prisma em `prisma/schema.prisma`.
- Testes Vitest/Supertest em `src/__tests__`.

LogiDesk, workers, Redis, BullMQ, Outbox, DLQ, Socket.IO autenticado e SSO real ficam documentados como fases futuras porque nao ha base correspondente neste checkout.

## Plano tecnico

### Fase 1

- Criar testes de regressao para rotas existentes de registro, login, drivers, vehicles e deliveries.
- Registrar matriz de funcionalidades testadas.
- Manter testes existentes de API key.

### Fase 2

- Adicionar modelos `User`, `DriverProfile` e `RefreshSession` ao schema raiz.
- Criar migration gradual sem remover `Driver.password`.
- Manter `Driver` legado para compatibilidade e relacionar `DriverProfile.driverId`.
- Atualizar criacao de motorista para criar `User` + `DriverProfile` em transacao.

### Fase 3

- Criar endpoints versionados:
  - `POST /api/v1/auth/register`
  - `POST /api/v1/auth/login`
  - `POST /api/v1/auth/refresh`
  - `POST /api/v1/auth/logout`
  - `GET /api/v1/auth/me`
- Validar payload com Zod.
- Nao retornar hashes ou refresh tokens.
- Usar access token curto e refresh token em cookie HttpOnly.

### Fase 4

- Criar endpoints:
  - `GET /api/v1/driver/me`
  - `GET /api/v1/driver/deliveries`
  - `GET /api/v1/driver/deliveries/:id`
  - `PATCH /api/v1/driver/deliveries/:id/status`
- Obter motorista via `JWT sub -> User -> DriverProfile`.
- Retornar 403 para entrega alheia.
- Retornar 422 para status invalido.

### Fase 5

- Mapear consumidores atuais das rotas legadas no frontend raiz.
- Preservar comportamento das rotas antigas durante a transicao.
- Adicionar headers `Deprecation`, `Sunset` e `Link` quando houver sucessor versionado real.
- Registrar warning estruturado para uso de rota legada.
- Nao remover rota ate existir endpoint v1 equivalente, migracao do frontend e ausencia de uso observada em logs.

### Fase 7

- Corrigir o dashboard operacional para consumir uma rota real versionada.
- Expor `GET /api/v1/dashboard/metrics`.
- Manter `GET /dashboard/metrics` como alias legado depreciado.
- Calcular metricas reais de veiculos, motoristas, veiculos em rota, entregas concluidas e serie de 7 dias.
- Cobrir agregacao e compatibilidade legada com testes.

## Fora de escopo nesta execucao

- Reconstrucao completa do LogiDesk.
- SSO real entre dois produtos.
- Redis/BullMQ/Outbox/DLQ.
- Docker completo.
- CI/CD completo.
- Playwright E2E completo.

Esses itens dependem de estrutura que ainda nao existe no checkout atual.
