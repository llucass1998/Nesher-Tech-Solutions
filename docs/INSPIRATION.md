# Referências e Inspirações

Este documento registra os projetos de referência estudados para adoção de padrões funcionais e arquiteturais na LogiPlatform, conforme diretriz GSD.

## Fleetbase
- **Repositório:** [Fleetbase](https://github.com/fleetbase/fleetbase)
- **Funcionalidade estudada:** Kanban operacional, Workflows configuráveis, Zonas de serviço, Webhooks, Extensões.
- **Padrão adaptado:** Padrões de arquitetura para gestão logística unificada e extensibilidade.
- **Licença:** MIT (verificar no repositório oficial).
- **Código reutilizado:** Não. Apenas inspiração de design e modelagem.
- **Decisão arquitetural:** Adoção de um modelo multi-tenant com outbox e hooks nativos para integradores.

## Traccar
- **Repositório:** [Traccar](https://github.com/traccar/traccar)
- **Funcionalidade estudada:** GPS em tempo real, Geofence, Alertas e Comportamento do motorista.
- **Padrão adaptado:** Processamento de eventos geolocalizados e filas de alta performance.
- **Licença:** Apache 2.0.
- **Código reutilizado:** Não.
- **Decisão arquitetural:** Separação de rotas de ingestão (alto throughput) das rotas de gestão administrativa.

## ERPNext
- **Repositório:** [Frappe/ERPNext](https://github.com/frappe/erpnext)
- **Funcionalidade estudada:** Centros de distribuição, Custos e rentabilidade, Ativos.
- **Padrão adaptado:** Abstração de Domain Driven Design para monolitos/monorepos.
- **Licença:** GNU GPL v3.
- **Código reutilizado:** Não. (Evitar GPL estrito no core se não formos open source full).
- **Decisão arquitetural:** Módulos altamente desacoplados por Domínio.

## Zammad
- **Repositório:** [Zammad](https://github.com/zammad/zammad)
- **Funcionalidade estudada:** Omnichannel, Macros, SLA, Escalonamento.
- **Padrão adaptado:** Fila de tickets do LogiDesk e SLAs granulares.
- **Licença:** GNU AGPL v3.
- **Código reutilizado:** Não.
- **Decisão arquitetural:** WebSockets (Socket.IO) para atualizações bidirecionais de estado de ticket no Frontend.

## Frappe HR
- **Repositório:** [Frappe HR](https://github.com/frappe/hrms)
- **Funcionalidade estudada:** Aprovações multinível, Ciclo do colaborador, Folha versionada.
- **Padrão adaptado:** Separação estrita de dados de LogiPeople vs LogiPayroll (imutabilidade de fechamentos).
- **Licença:** GNU GPL v3.
- **Código reutilizado:** Não.
- **Decisão arquitetural:** Fechamentos de folha como eventos consolidados no Outbox, imutáveis pós aprovação.
