# LogiFlow - Guia para Agentes

## Visao geral da arquitetura

LogiFlow e uma aplicacao full stack em uma unica base. O frontend usa Next.js App Router em `app/`, com telas client-side para login, dashboard, motoristas, veiculos, entregas e app do motorista. O backend principal nao esta implementado como Route Handlers do Next; ele e uma API Express separada em `src/`, iniciada por `src/server.ts` na porta `3333`.

A API Express centraliza o roteamento em `src/routes.ts`, instancia controllers por recurso e encaminha cada rota diretamente para metodos de controller. A camada de persistencia e acessada pelos controllers via Prisma em `src/lib/prisma.ts`, com client gerado em `src/generated/prisma` e schema em `prisma/schema.prisma`. Nao ha uma camada formal de services ou repositories hoje: regras de validacao, chamadas Prisma e respostas HTTP estao concentradas nos controllers.

O dominio atual cobre autenticacao de motoristas por JWT, cadastro de usuarios/motoristas, veiculos e entregas. Entregas carregam `price` e alimentam indicadores de faturamento no frontend, mas nao ha modulo, controller ou rota nomeada como pagamento. Qualquer trabalho em "pagamentos" deve primeiro explicitar se o alvo sao endpoints de `deliveries` que manipulam `price`/faturamento ou se sera criado um novo dominio.

## Estrutura e camadas

- `app/`: rotas e telas do Next.js App Router. Arquivos `page.tsx` expoem paginas; `layout.tsx` define layouts.
- `components/`: componentes React compartilhados, como mapa.
- `src/server.ts`: bootstrap da API Express, CORS, JSON parser e `app.use(routes)`.
- `src/routes.ts`: tabela de rotas REST da API Express.
- `src/controllers/`: controllers HTTP por recurso. Eles validam entrada, chamam Prisma e montam resposta.
- `src/middlewares/`: middlewares Express. Hoje existe `verificarToken` para JWT.
- `src/lib/prisma.ts`: inicializacao do Prisma com `DATABASE_URL`.
- `prisma/schema.prisma`: modelos `Driver`, `Vehicle` e `Delivery`.
- `prisma/migrations/`: historico de migracoes.

## Convencoes de codigo

- Antes de alterar codigo Next.js, consultar a documentacao local relevante em `node_modules/next/dist/docs/`, pois a versao instalada e Next.js `16.2.6`.
- Manter a API Express em `src/`; nao mover endpoints existentes para Route Handlers do Next sem uma decisao explicita de arquitetura.
- Seguir o padrao atual de controllers com classes e metodos async recebendo `Request` e `Response`.
- Centralizar rotas Express em `src/routes.ts` e middlewares reutilizaveis em `src/middlewares/`.
- Usar Prisma via `src/lib/prisma.ts`; nao instanciar `PrismaClient` diretamente em controllers ou testes de feature.
- Ler configuracoes sensiveis de `process.env`; nunca hardcodar URL de banco, JWT secret, API keys, tokens ou senhas.
- Responder erros HTTP em JSON no formato `{ error: string }`, preservando o contrato existente.
- Manter nomes de rotas REST no plural e em ingles: `/drivers`, `/vehicles`, `/deliveries`.
- Preservar status de entrega existentes: `PENDING`, `IN_TRANSIT`, `DELIVERED`, salvo migracao/versionamento explicito.
- Evitar logs com payloads completos de request, headers de autenticacao, tokens ou chaves.
- Corrigir inconsistencias de documentacao quando tocar na area relacionada. Atualmente o README cita `dev:web` e `/dashboard/metrics`, mas esses itens nao existem no `package.json`/`src/routes.ts`.

## Comandos essenciais

- Instalar dependencias: `npm install`
- Frontend Next em desenvolvimento: `npm run dev`
- API Express em desenvolvimento: `npm run dev:api`
- Build de producao do Next: `npm run build`
- Start de producao do Next: `npm run start`
- Lint: `npm run lint`
- Testes automatizados: `npm test`
- Gerar Prisma Client: `npm run prisma:generate`
- Criar/aplicar migracao local: `npm run prisma:migrate`
- Aplicar migracoes em ambiente alvo: `npm run prisma:deploy`

## Testes

Os testes automatizados usam Vitest e Supertest para exercitar a API Express sem subir `src/server.ts`. Use `npm test`.

Para novos endpoints ou alteracoes de contrato, usar TDD sempre que possivel: primeiro testes de comportamento HTTP, depois implementacao minima.

## Regras de ouro

- Nunca alterar contratos publicos da API sem versionar, documentar e cobrir compatibilidade.
- Nunca adicionar autenticacao em endpoints consumidos pelo frontend atual sem mapear e preservar os consumidores existentes ou atualizar esses consumidores na mesma tarefa.
- Nunca colocar segredos no codigo, nos testes, no README, em logs ou em snapshots.
- Nunca commitar `.env`, banco local, dumps, tokens, API keys ou credenciais.
- Sempre adicionar teste automatizado para novo endpoint, novo middleware ou mudanca de autorizacao.
- Sempre testar os caminhos de erro de autenticacao/autorizacao: sem credencial, credencial invalida e credencial valida.
- Sempre validar que mudancas de middleware nao bloqueiam rotas que devem continuar publicas.
- Sempre manter migracoes Prisma junto com qualquer mudanca de schema.
- Sempre apresentar o diff e um resumo dos riscos antes de considerar uma tarefa concluida.
- Nunca considerar uma mudanca pronta sem testes passando, salvo se houver bloqueio tecnico explicitamente informado.

## Guardrails permanentes

### Qualidade

Nenhuma mudanca e considerada pronta sem testes passando e sem um diff revisavel. Ao final de cada tarefa, apresentar o que mudou, quais comandos foram executados e os riscos residuais.

### Seguranca

Verificar que nenhum segredo foi escrito em codigo, logs, documentacao ou testes. Qualquer valor sensivel deve vir de variavel de ambiente, com exemplo seguro em `.env.example` quando necessario.

### Custo

Quando a tarefa usar loops, exploracao extensa ou multiplos agentes, relatar uma estimativa curta do esforco gasto e sugerir como reduzir uso em proximas iteracoes, por exemplo limitando escopo, numero de agentes ou quantidade de rodadas de revisao.
