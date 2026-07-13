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

## 2026-07-13 - CI/CD com npm e workflows por dominio

Decisao: criar workflows separados para LogiFlow, LogiPeople e integracao/plataforma usando Node.js 24 e `npm ci`.

Motivo: o checkout atual possui `package-lock.json` e os comandos validados localmente usam npm. Tambem nao ha app LogiDesk neste checkout, entao criar um workflow LogiDesk dedicado seria artificial.

Consequencia: alteracoes em LogiFlow, LogiPeople e pacotes compartilhados disparam pipelines adequados por path. O audit bloqueia vulnerabilidades altas; vulnerabilidades moderadas restantes ficam documentadas para uma fase dedicada de upgrade de dependencias.
