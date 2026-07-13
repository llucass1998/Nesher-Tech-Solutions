# Implementation Plan

## Escopo desta execucao

Implementar apenas:

1. Fase 1 - Diagnostico e testes de regressao.
2. Fase 2 - Consolidacao gradual de `User` e `DriverProfile`.
3. Fase 3 - Autenticacao versionada em `/api/v1/auth/*`.
4. Fase 4 - Ownership do motorista em `/api/v1/driver/*`.
5. Fase 5 - Depreciacao controlada das rotas legadas.
6. Fase 7 - Primeiro incremento operacional do LogiFlow.
7. Fase 8 - UI/UX e design system compartilhado.
8. Fase 9 - Observabilidade.
9. Fase 10 - Testes completos no escopo disponivel.
10. Fase 11 - Docker e seguranca basica do runtime.
11. Fase 12 - CI/CD.
12. Fase 13 - Documentacao.

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
- Criar fundacao operacional de entregas com filtros, paginacao e busca.
- Criar historico/timeline de entrega.
- Registrar ocorrencias operacionais.
- Registrar comprovantes.
- Permitir reprocessamento seguro de ocorrencias em `FAILED` ou `DEAD_LETTER`.
- Aplicar RBAC `ADMIN`/`OPERATOR` nos endpoints operacionais.
- Atualizar a tela de entregas mantendo fallback legado quando nao houver token v1.

### Fase 8

- Criar `packages/ui`, ausente no checkout atual.
- Consolidar componentes compartilhados de estado e feedback:
  - `StatusBadge`;
  - `PriorityBadge`;
  - `EmptyState`;
  - `ErrorState`;
  - `LoadingSkeleton`;
  - `Pagination`;
  - `ToolbarButton`.
- Aplicar o pacote compartilhado na tela critica de entregas.
- Manter dimensoes estaveis para badges, skeletons e paginacao.
- Validar lint, typecheck, testes e build incluindo workspaces.

### Fase 9

- Criar logger estruturado com redaction de tokens, cookies, senhas e hashes.
- Adicionar middleware de request context com `requestId` e `correlationId`.
- Propagar `x-request-id` e `x-correlation-id` no response.
- Registrar logs HTTP com metodo, rota, status, duracao, usuario e role quando disponiveis.
- Criar health checks:
  - `GET /api/v1/health/live`;
  - `GET /api/v1/health/ready`.
- Criar endpoint de metricas em texto Prometheus:
  - `GET /api/v1/metrics`.
- Manter Prometheus/Grafana/OpenTelemetry como preparacao futura, sem obrigar ambiente local.

### Fase 10

- Ampliar testes de autenticacao v1:
  - email duplicado;
  - role publica proibida;
  - credenciais invalidas;
  - `/me` sem token.
- Ampliar testes de ownership do motorista:
  - motorista sem perfil;
  - entrega inexistente;
  - atualizacao valida de status.
- Ampliar testes operacionais:
  - severidade invalida;
  - comprovante sem URL;
  - reprocessamento bloqueado fora de `FAILED`/`DEAD_LETTER`.
- Ampliar testes de observabilidade:
  - readiness com banco indisponivel.
- Registrar limites dos testes que dependem de LogiDesk, Redis, Docker e Playwright.

### Fase 11

- Criar Dockerfiles separados para API Express e web Next.
- Criar `docker-compose.yml` para LogiFlow DB, API e web.
- Criar servico one-shot de migration com `prisma migrate deploy`.
- Fazer a API depender da conclusao bem-sucedida das migrations.
- Exigir segredos e senhas por variavel de ambiente no Compose.
- Permitir portas configuraveis por variavel de ambiente.
- Rodar containers com usuario nao privilegiado.
- Adicionar health checks para banco, API e web.
- Adicionar `helmet` na API.
- Tornar `PORT` e `WEB_ORIGIN` configuraveis.
- Atualizar `.env.example` sem segredos reais.
- Validar `docker compose config`, build, subida da stack, health checks e logs.
- Registrar vulnerabilidades de dependencias encontradas por `npm audit`.

### Fase 12

- Criar workflows GitHub Actions separados para:
  - LogiFlow;
  - LogiPeople;
  - integracao/plataforma.
- Usar Node.js 24 e `npm ci`, alinhado ao lockfile atual.
- Executar lint, typecheck, testes, build e audit de alta severidade.
- Validar Prisma generate para LogiFlow e LogiPeople.
- Validar Docker Compose e build Docker do LogiFlow.
- Executar smoke test Docker do LogiFlow com health checks reais.
- Usar filtros por path para evitar CI desnecessario.
- Documentar que LogiDesk segue bloqueado por ausencia de app neste checkout.

### Fase 13

- Atualizar README com estado real do monorepo.
- Atualizar `docs/CURRENT_STATE.md` e `docs/ARCHITECTURE.md`.
- Criar guias de autenticacao, autorizacao, API, LogiFlow, LogiPeople, integracao, eventos, observabilidade, testes, deploy e troubleshooting.
- Registrar explicitamente pendencias de LogiDesk, Redis/BullMQ, Outbox/DLQ, Socket.IO e E2E.
- Manter documentacao sem segredos reais.
- Validar links, comandos e consistencia basica com lint/build.

## Fora de escopo nesta execucao

- Reconstrucao completa do LogiDesk.
- SSO real entre dois produtos.
- Redis/BullMQ/Outbox/DLQ.
- Playwright E2E completo.

Esses itens dependem de estrutura que ainda nao existe no checkout atual.
