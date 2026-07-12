# LogiFlow

Plataforma full stack para gestão logística empresarial, com controle de entregas, motoristas, veículos, dashboard operacional e base preparada para central de chamados e assistente WAHA.

O projeto foi desenvolvido com frontend em Next.js e backend em Node.js/Express, usando Prisma com PostgreSQL para persistencia dos dados.

## Sobre o projeto

A proposta do sistema e centralizar a rotina operacional de uma logistica simples: cadastrar motoristas, controlar veiculos, criar entregas, atualizar status e acompanhar o desempenho por meio de metricas visuais.

Este projeto tambem foi pensado como portfolio full stack, mostrando integracao entre frontend, API REST, banco de dados, autenticacao e dashboard administrativo.

## Funcionalidades

- Login com autenticacao JWT
- Cadastro de motoristas
- Cadastro de veiculos
- Cadastro e gerenciamento de entregas
- Atualizacao de status de entregas
- Controle de status de motoristas
- Controle de status de veiculos
- Dashboard com metricas operacionais
- Grafico de entregas dos ultimos 7 dias
- Calculo de faturamento diario e mensal
- Area/app do motorista para acompanhamento das entregas
- Visualizacao com mapa usando Leaflet
- API REST integrada ao frontend

## Indicadores do dashboard

- Veiculos cadastrados
- Motoristas ativos
- Veiculos em rota
- Entregas finalizadas
- Faturamento do dia
- Faturamento do mes
- Volume de entregas dos ultimos 7 dias

## Tecnologias utilizadas

- Next.js
- React
- TypeScript
- Tailwind CSS
- Node.js
- Express
- Prisma
- PostgreSQL
- JWT
- Bcrypt
- Axios
- Recharts
- Leaflet
- React Leaflet

## Estrutura do projeto

```text
app/
  dashboard/          # Painel administrativo do LogiFlow
  driver-app/         # Area do motorista
  register/           # Cadastro

src/
  controllers/        # Controllers da API Express do LogiFlow
  lib/                # Configuracao do Prisma do LogiFlow
  middlewares/        # Middlewares de autenticacao
  routes.ts           # Rotas da API Express
  server.ts           # Servidor Express

prisma/
  schema.prisma       # Modelagem do banco de dados do LogiFlow

apps/
  logipeople-web/     # Frontend independente do LogiPeople
  logipeople-api/     # API NestJS independente do LogiPeople
  logipeople-worker/  # Worker independente do LogiPeople

packages/
  auth/               # Tipos de identidade, papéis e escopos
  contracts/          # Contratos Zod HTTP
  event-contracts/    # Contratos Zod de eventos
  config/             # Validação de variáveis
  logger/             # Logger com redaction

databases/
  logipeople/         # Prisma schema, migrations e seed do LogiPeople
```

## Modelos principais

O banco de dados possui tres entidades centrais:

- `Driver`: motoristas cadastrados no sistema.
- `Vehicle`: veiculos disponiveis para operacao.
- `Delivery`: entregas, valores, enderecos, status, motorista e veiculo vinculados.

## Como rodar localmente

Clone o repositorio:

```bash
cd C:\\Users\\lluca\\Documents\\Codex\\LogiFlow
```

Instale as dependencias:

```bash
npm install
```

Crie o arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

Configure as variaveis:

```env
DATABASE_URL="postgresql://usuario:senha@localhost:5432/sistema_logistica?schema=public"
JWT_SECRET="troque-essa-chave"
NEXT_PUBLIC_API_URL="http://localhost:3333"
```

Gere o client do Prisma:

```bash
npx prisma generate
```

Inicie o projeto:

```bash
npm run dev
```

O comando acima inicia:

- Frontend: `http://localhost:3000`
- API: `http://localhost:3333`

## Scripts disponiveis

```bash
npm run dev                         # Inicia o frontend Next.js do LogiFlow
npm run dev:api                     # Inicia apenas a API Express do LogiFlow
npm run build                       # Gera build de producao do LogiFlow
npm run lint                        # Executa o ESLint
npm run test                        # Executa testes automatizados
npm run prisma:generate             # Gera o client Prisma do LogiFlow
npm run logipeople:dev:web          # Inicia o frontend LogiPeople na porta 3400
npm run logipeople:dev:api          # Inicia a API LogiPeople na porta 3433
npm run logipeople:dev:worker       # Inicia o worker LogiPeople
npm run logipeople:prisma:generate  # Gera o client Prisma do LogiPeople
npm run logipeople:prisma:migrate   # Aplica migrations locais do LogiPeople
```

## Rotas principais da API

### Autenticacao

- `POST /login`
- `POST /users`

### Motoristas

- `GET /drivers`
- `POST /drivers`
- `PUT /drivers/:id`
- `DELETE /drivers/:id`
- `PATCH /drivers/:id/status`

### Veiculos

- `GET /vehicles`
- `POST /vehicles`
- `PUT /vehicles/:id`
- `DELETE /vehicles/:id`
- `PATCH /vehicles/:id/status`

### Entregas

- `GET /deliveries`
- `GET /deliveries/:id`
- `POST /deliveries`
- `PUT /deliveries/:id`
- `DELETE /deliveries/:id`
- `PATCH /deliveries/:id/status`

## Aprendizados do projeto

- Organizacao de um projeto full stack em uma unica base
- Integracao entre Next.js e uma API Express
- Modelagem de dados relacionais com Prisma
- Uso de JWT para proteger rotas sensiveis
- Construcao de dashboard com indicadores reais
- Consumo de API REST no frontend
- Separacao de responsabilidades entre rotas, controllers e banco de dados

## Autor

Desenvolvido por Lucas Souza.

- GitHub: [llucass1998](https://github.com/llucass1998)
- LinkedIn: [Lucas Souza](https://www.linkedin.com/in/lucas-souza-52422b160/)
