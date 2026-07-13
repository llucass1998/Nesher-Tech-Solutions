# Decisions

## 2026-07-12 - Aplicar Fases 1-4 ao LogiFlow legado

Decisao: implementar Fases 1-4 no LogiFlow legado da raiz (`src/`, `app/`, `prisma/`) em vez de criar artificialmente `apps/logiflow-*` e `apps/logidesk-*`.

Motivo: o checkout atual nao contem os apps LogiFlow/LogiDesk descritos no prompt. Criar esses produtos do zero violaria a regra de nao reconstruir o projeto do zero.

Consequencia: LogiDesk, workers, Redis, Outbox e CI/CD foram inicialmente documentados como pendentes ate existir uma base real para eles. Fases posteriores criaram CI/CD e Docker para o que existia no checkout, e a execucao atual adicionou uma fundacao LogiDesk e workers.

## 2026-07-12 - Migracao gradual de identidade

Decisao: adicionar `User`, `DriverProfile` e `RefreshSession`, preservando `Driver` legado e `Driver.password` temporariamente.

Motivo: o prompt exige migration gradual e proibe remocao abrupta de funcionalidades. `Delivery` ainda referencia `Driver`.

Consequencia: durante a transicao, autenticacao versionada usa `User`, enquanto rotas legadas continuam compativeis.

## 2026-07-12 - Ownership por DriverProfile

Decisao: endpoints `/api/v1/driver/*` resolvem motorista por `JWT sub -> User -> DriverProfile -> driverId`.

Motivo: o frontend nunca deve enviar `driverId` como fonte de autorizacao.

Consequencia: entregas alheias retornam `403`, motorista sem perfil retorna `403`.

## 2026-07-13 - CI/CD com npm e workflows por dominio

Decisao: criar workflows separados para LogiFlow, LogiPeople e integracao/plataforma usando Node.js 24 e `npm ci`.

Motivo: o checkout atual possui `package-lock.json` e os comandos validados localmente usam npm. Apos a criacao da fundacao LogiDesk, o produto passou a ter workflow dedicado.

Consequencia: alteracoes em LogiFlow, LogiPeople, LogiDesk e pacotes compartilhados disparam pipelines adequados por path. O audit completo deve permanecer com 0 vulnerabilidades conhecidas, exceto quando houver excecao documentada e aprovada.

## 2026-07-13 - Documentacao reflete o checkout real

Decisao: documentar LogiFlow raiz, LogiPeople e a fundacao LogiDesk como produtos presentes, mantendo explicitas as lacunas do LogiDesk empresarial.

Motivo: a documentacao deve seguir o codigo real. Antes da fundacao LogiDesk, declarar o produto como existente seria falso; agora tambem seria falso declarar que ele esta completo.

Consequencia: a Fase 13 consolida guias praticos para o que existe e registra explicitamente pendencias de worker distribuido completo, DLQ operacional, Socket.IO, SSO e E2E.

## 2026-07-13 - LogiDesk fundacional sem declarar produto completo

Decisao: criar `apps/logidesk-api`, `apps/logidesk-web`, `apps/logidesk-worker`, `apps/logiflow-worker`, `databases/logidesk` e a primeira integracao LogiFlow -> LogiDesk, mas marcar como fundacao.

Motivo: o usuario pediu evoluir a plataforma completa. A entrega segura possivel nesta etapa e criar a base validavel com banco separado, API, web, workers, Docker, CI e idempotencia, sem declarar SLA/Socket.IO/SSO/E2E como completos.

Consequencia: Docker e smoke test agora cobrem LogiFlow, LogiDesk e Redis. A integracao ainda precisa de dispatcher real de outbox, retry/DLQ persistente, SSO/JWKS, Socket.IO autenticado e E2E completo antes de ser marcada como empresarialmente pronta.

## 2026-07-13 - Holerites apenas como demonstrativos restritos

Decisao: implementar `Payslip` e `PayslipLine` no LogiPeople como registros demonstrativos restritos derivados de `PayrollRun` e `PayrollItem`, sempre com `legalValidationPending` e `visibleToEmployee=false`.

Motivo: a base precisava fechar a Fase 14 preliminar sem declarar calculo legal, publicacao oficial, PDF assinado, pagamento ou eSocial.

Consequencia: o modulo pode registrar evidencia auditada e idempotente de holerite demonstrativo, mas nao pode publicar para colaborador nem ser tratado como holerite legalmente validado sem uma fase futura de DP/legal.
