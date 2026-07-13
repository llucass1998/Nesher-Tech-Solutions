# LogiDesk

Data: 2026-07-13

## Estado encontrado

Nao existe uma implementacao LogiDesk neste checkout.

Buscas executadas nao encontraram arquivos com nomes ou dominios relacionados a:

- `logidesk`
- `ticket`
- `support`
- `chamado`
- `sla`
- `message`
- `inbox`
- `kanban`
- `atendimento`
- `suporte`

A pasta `apps/` contem:

- `apps/logipeople-api`
- `apps/logipeople-web`
- `apps/logipeople-worker`

O LogiFlow legado continua na raiz (`app/`, `src/`, `prisma/`), nao em `apps/logiflow-*`.

## Decisao tecnica

A Fase 6 esta bloqueada neste workspace porque o prompt mestre exige completar e preservar um produto LogiDesk existente, mas a base esperada nao esta presente.

Nao foi criado `apps/logidesk-api`, `apps/logidesk-web` ou `apps/logidesk-worker` nesta etapa porque isso seria criar um produto novo do zero, nao evoluir a base existente.

## Pre-requisitos para desbloquear

Para continuar a Fase 6 sem reconstruir indevidamente, uma destas condicoes precisa ser atendida:

1. Trazer para este checkout a branch ou commit que contem `apps/logidesk-api`, `apps/logidesk-web` e `apps/logidesk-worker`.
2. Confirmar explicitamente que a proxima etapa deve criar o LogiDesk do zero dentro deste monorepo.
3. Redefinir a Fase 6 para implementar apenas contratos e preparacao de integracao no LogiFlow legado, deixando o produto LogiDesk para uma etapa posterior.

## Escopo esperado quando desbloqueado

Quando a base LogiDesk estiver disponivel, a Fase 6 deve validar e completar:

- Dashboard.
- Caixa de entrada.
- Meus chamados.
- Todos os chamados.
- Kanban.
- Equipes.
- SLA.
- Categorias.
- Relatorios.
- Notificacoes.
- Configuracoes.
- Busca, paginacao, ordenacao e filtros.
- Detalhe do chamado.
- Mensagens.
- Notas internas.
- Historico.
- Auditoria.
- Eventos.
- Socket.IO.
- Testes unitarios, integracao e E2E.

## Guardrail

Nenhum item de LogiDesk deve ser marcado como `PASS` sem evidencia de codigo, teste, build e execucao real no modulo correspondente.
