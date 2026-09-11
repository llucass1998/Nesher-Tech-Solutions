Nesher Tech Solutions

Plataforma empresarial multiempresa da Nesher Tech Solutions. O monorepo reúne o portal de atendimento, identidade centralizada, gestão de chamados (LogiDesk), pessoas (LogiPeople), folha/DP (LogiPayroll) e o domínio logístico legado (LogiFlow).

O produto está em desenvolvimento. O portal principal já demonstra a experiência completa, mas parte dos dados de chamados, empresas, funcionários, visitas e comunicação ainda é mantida no localStorage. Para produção, essa interface deve ser conectada às APIs de Identity e LogiDesk descritas neste repositório.

Visão do produto

Cadastro e aprovação de empresas clientes.

Usuários, funcionários e permissões por empresa.

Abertura, triagem, atribuição e acompanhamento de chamados.

Mensagens públicas, notas internas, anexos, SLA e notificações.

Agenda de visitas e base para sessões de suporte remoto.

Indicadores operacionais para clientes, técnicos e administradores.

Temas, navegação lateral recolhível e preferências do dashboard.

Estado atual

Componente

O que já existe

Antes de produção

Portal Nesher (app/)

Dashboard amplo, responsivo, RBAC visual e fluxos de chamados

Substituir localStorage por APIs e sessão segura no servidor

LogiIdentity

JWT RS256/JWKS, sessões, MFA, cadastro e diretório

Concluir provisionamento multiempresa e política de convites

LogiDesk

Tickets, mensagens, notas, atribuição, SLA, anexos, notificações, Socket.IO, outbox e DLQ

Aplicar isolamento de tenant em toda leitura e integrar o portal principal

LogiPeople

Fundação de organização e pessoas

Consolidar integrações, autorização e dados reais

LogiPayroll

API, web, worker e banco próprios

Migrar os fluxos reais de DP/folha e concluir autenticação

LogiFlow

API/web legado de logística e worker

Reduzir acoplamento e remover código temporário

A análise técnica e o plano de evolução ficam em docs/AUDITORIA_PONTA_A_PONTA.md.

Arquitetura

flowchart TD
  P[Portais Web] --> I[LogiIdentity]
  P --> D[LogiDesk API]
  P --> H[LogiPeople e LogiPayroll]
  P --> F[LogiFlow API]
  D --> DB[(PostgreSQL por domínio)]
  H --> DB
  F --> DB
  I --> DB
  D --> R[(Redis e workers)]
  H --> R
  F --> R

Cada domínio possui banco e ciclo de deploy próprios. Redis é utilizado para filas/eventos, e o Identity emite os tokens consumidos pelos demais serviços.

Tecnologias

Node.js 24, pnpm 11 e TypeScript.

Next.js 16 com App Router e React 19.

NestJS 11 e API Express 5 legada.

Prisma 7 e PostgreSQL.

Redis, BullMQ e Socket.IO.

Vitest, ESLint, pnpm Workspaces, Docker Compose e GitHub Actions.

Estrutura do repositório

app/                         Portal web principal da Nesher
src/                         API Express do LogiFlow legado
prisma/                      Schema do LogiFlow
apps/identity-api            API central de identidade
apps/identity-worker         Worker de identidade
apps/logidesk-{api,web,worker}
                             Central de chamados
apps/logipeople-{api,web,worker}
                             Gestão de pessoas
apps/logipayroll-{api,web,worker}
                             DP e folha
apps/logiflow-worker         Integrações assíncronas do LogiFlow
packages/                    Auth, contratos, eventos, logger e UI
databases/                   Schemas Prisma por domínio
docs/                        Arquitetura, operação, segurança e planos

Pré-requisitos

Node.js 24.x.

pnpm 11.19.0 (Corepack recomendado).

Docker e Docker Compose para a pilha completa.

OpenSSL para gerar as chaves RSA do Identity.

Instalação local

corepack enable
pnpm install --frozen-lockfile
cp .env.example .env

Preencha os segredos do .env. Não reutilize os valores de exemplo em produção. Gere também as chaves RSA conforme docs/AUTHENTICATION.md.

Gere os clientes Prisma:

pnpm run prisma:generate
pnpm run identity:prisma:generate
pnpm run logidesk:prisma:generate
pnpm run logipeople:prisma:generate
pnpm run logipayroll:prisma:generate

Subir toda a pilha

docker compose config
docker compose up -d --build
docker compose ps

Executar serviços separadamente

# Portal Nesher e API LogiFlow
pnpm dev
pnpm run dev:api

# Identidade
pnpm run identity:dev:api
pnpm run identity:dev:worker

# Chamados
pnpm run logidesk:dev:web
pnpm run logidesk:dev:api
pnpm run logidesk:dev:worker

# Pessoas
pnpm run logipeople:dev:web
pnpm run logipeople:dev:api
pnpm run logipeople:dev:worker

# Folha/DP
pnpm run logipayroll:dev:web
pnpm run logipayroll:dev:api
pnpm run logipayroll:dev:worker

Portas padrão

Serviço

URL/porta

Portal Nesher

http://localhost:3000

LogiFlow API

http://localhost:3333

LogiPeople web / API

3400 / 3433

LogiDesk web / API

3500 / 3533

LogiPayroll web / API

3600 / 3733

LogiIdentity API

3633

Redis

6379

As portas podem ser alteradas no .env.

Qualidade

pnpm test
pnpm run lint
pnpm run typecheck
pnpm run test:workspaces
pnpm run typecheck:workspaces
pnpm run build
pnpm run build:workspaces

Os testes unitários da raiz e do LogiDesk podem ser executados sem subir o Docker. Testes de integração dependem de bancos, Redis e variáveis de ambiente válidas.

Segurança

A API LogiDesk exige JWT por padrão; desabilitar autenticação deve ser limitado a testes de compatibilidade.

O simulador de papéis do portal fica desligado. Para uma demonstração local, use NEXT_PUBLIC_ENABLE_ROLE_SIMULATOR=true; ele continua restrito a uma sessão administrativa real.

O frontend nunca deve ser a autoridade final de permissões. Toda consulta e mutação deve validar usuário, papel e tenantId no backend.

Tokens duradouros não devem ficar em localStorage; prefira cookie HttpOnly, Secure e SameSite com rotação de sessão.

Suporte remoto deve exigir autorização explícita do usuário, expiração curta, MFA e trilha de auditoria.

Consulte docs/SECURITY.md, docs/AUTHORIZATION.md e docs/LGPD.md.

Documentação

docs/CURRENT_STATE.md — estado técnico atual.

docs/ARCHITECTURE.md — arquitetura e limites dos domínios.

docs/API.md — contratos HTTP.

docs/AUTHENTICATION.md — login, tokens e chaves.

docs/DEPLOYMENT.md — implantação.

docs/TESTING.md — estratégia de testes.

docs/TROUBLESHOOTING.md — problemas comuns.

Direção recomendada

O próximo marco deve transformar o portal principal em cliente do LogiIdentity e LogiDesk, com cadastro por CNPJ, convite de funcionários e isolamento por empresa. Depois disso, a comunicação pode evoluir de comentários por chamado para canais e mensagens diretas no estilo Teams; por último, o suporte remoto pode ser integrado a um provedor como RustDesk ou MeshCentral com consentimento e auditoria.
