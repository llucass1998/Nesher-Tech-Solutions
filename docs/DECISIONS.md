# Decisions

## 2026-07-12 - Aplicar Fases 1-4 ao LogiFlow legado

Decisao: implementar Fases 1-4 no LogiFlow legado da raiz (`src/`, `app/`, `prisma/`) em vez de criar artificialmente `apps/logiflow-*` e `apps/logidesk-*`.

Motivo: o checkout atual nao contem os apps LogiFlow/LogiDesk descritos no prompt. Criar esses produtos do zero violaria a regra de nao reconstruir o projeto do zero.

Consequencia: LogiDesk, workers, Redis, Outbox e CI/CD serao documentados como pendentes ate existir uma base real para eles.

## 2026-07-12 - Migração gradual de identidade

Decisao: adicionar `User`, `DriverProfile` e `RefreshSession`, preservando `Driver` legado e `Driver.password` temporariamente.

Motivo: o prompt exige migration gradual e proibe remocao abrupta de funcionalidades. `Delivery` ainda referencia `Driver`.

Consequencia: durante a transicao, autenticação versionada usa `User`, enquanto rotas legadas continuam compatíveis.

## 2026-07-12 - Ownership por DriverProfile

Decisao: endpoints `/api/v1/driver/*` resolvem motorista por `JWT sub -> User -> DriverProfile -> driverId`.

Motivo: o frontend nunca deve enviar `driverId` como fonte de autorizacao.

Consequencia: entregas alheias retornam `403`, motorista sem perfil retorna `403`.
