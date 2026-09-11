'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';

type TicketStatus = 'Novo' | 'Em análise' | 'Em Atendimento' | 'Aguardando Peças' | 'Aguardando cliente' | 'Agendado' | 'Em atendimento' | 'Resolvido' | 'Fechado';
type Ticket = {
  id: string;
  code?: string;
  subject?: string;
  title?: string;
  company: string;
  category: string;
  priority: 'Urgente' | 'Alta' | 'Média' | 'Baixa';
  status: TicketStatus;
  time?: string;
  createdAt?: string;
  slaStatus?: 'normal' | 'warning' | 'breached';
  initials?: string;
  color?: string;
};

const statusFilters = ['Todos', 'Novos', 'Em atendimento', 'Resolvidos'];

export default function DashboardHomePage() {
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [showAll, setShowAll] = useState(false);
  const [toast, setToast] = useState('');
  const [firstName, setFirstName] = useState('Admin');
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    try {
      const rawUser = window.localStorage.getItem('logiflow_user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        if (user.name) {
          setFirstName(user.name.split(' ')[0]);
        }
      }

      const storedTickets = window.localStorage.getItem('nesher_tickets');
      if (storedTickets) {
        const parsed = JSON.parse(storedTickets);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(
            (t: any) =>
              !['Acme Corporation', 'Clínica São Lucas', 'Mercado Central', 'Studio Norte', 'Grupo Horizonte', 'Logística Express', 'Distribuidora Alfa'].includes(t.company)
          );
          setTickets(clean);
        }
      }
    } catch {}
  }, []);

  const metrics = useMemo(() => {
    const openTickets = tickets.filter(
      (t) => t.status !== 'Resolvido' && t.status !== 'Fechado'
    ).length;

    const inProgress = tickets.filter(
      (t) => t.status === 'Em Atendimento' || t.status === 'Em atendimento' || t.status === 'Em análise'
    ).length;

    const resolved = tickets.filter(
      (t) => t.status === 'Resolvido' || t.status === 'Fechado'
    ).length;

    const breached = tickets.filter((t) => t.slaStatus === 'breached').length;
    const warning = tickets.filter((t) => t.slaStatus === 'warning').length;
    const normal = tickets.length - breached - warning;

    const slaPct = tickets.length > 0 ? Math.round(((tickets.length - breached) / tickets.length) * 100) : 100;

    return {
      openTickets,
      inProgress,
      resolved,
      slaPct,
      slaNormal: Math.max(0, normal),
      slaWarning: warning,
      slaBreached: breached,
      avgTime: tickets.length > 0 ? '42m' : '--'
    };
  }, [tickets]);

  const visibleTickets = useMemo(() => {
    const filtered = activeFilter === 'Todos' ? tickets : tickets.filter((ticket) => {
      if (activeFilter === 'Novos') return ticket.status === 'Novo' || ticket.status === ('Em Triagem' as any);
      if (activeFilter === 'Em atendimento') return ticket.status === 'Em Atendimento' || ticket.status === 'Em atendimento' || ticket.status === 'Em análise';
      if (activeFilter === 'Resolvidos') return ticket.status === 'Resolvido' || ticket.status === 'Fechado';
      return ticket.status === activeFilter;
    });
    return showAll ? filtered : filtered.slice(0, 4);
  }, [tickets, activeFilter, showAll]);

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(''), 2600);
  }

  return (
    <div className="nesher-dashboard">
      {toast && <div className="nesher-toast"><i className="ti ti-check" aria-hidden="true" />{toast}</div>}
      <section className="nesher-welcome-row">
        <div>
          <p className="nesher-eyebrow">CENTRAL OPERACIONAL NESHER TECH</p>
          <h1>Olá, {firstName} <span>✦</span></h1>
          <p className="nesher-welcome-copy">Aqui está o resumo da operação da sua empresa hoje.</p>
        </div>
        <button
          className="nesher-primary-button"
          type="button"
          onClick={() => window.location.href = '/dashboard/chamados'}
        >
          <i className="ti ti-plus" aria-hidden="true" />
          Abrir novo chamado
        </button>
      </section>

      <section className="nesher-metric-grid" aria-label="Indicadores">
        <MetricCard
          icon="ti-ticket"
          label="Chamados abertos"
          value={String(metrics.openTickets)}
          detail={metrics.openTickets === 0 ? "0%" : "+100%"}
          detailCopy="da fila total"
          tone="blue"
        />
        <MetricCard
          icon="ti-clock-hour-4"
          label="Em atendimento"
          value={String(metrics.inProgress)}
          detail={String(metrics.inProgress)}
          detailCopy="com técnicos alocados"
          tone="orange"
        />
        <MetricCard
          icon="ti-circle-check"
          label="Resolvidos este mês"
          value={String(metrics.resolved)}
          detail={metrics.resolved > 0 ? "100%" : "0%"}
          detailCopy="taxa de entrega"
          tone="green"
        />
        <MetricCard
          icon="ti-alarm"
          label="Tempo médio de resposta"
          value={metrics.avgTime}
          detail="SLA ágil"
          detailCopy="meta < 2h"
          tone="purple"
        />
      </section>

      <section className="nesher-dashboard-grid">
        <div className="nesher-panel nesher-ticket-panel">
          <div className="nesher-panel-header">
            <div>
              <h2>Chamados recentes</h2>
              <p>Acompanhe os últimos chamados e ordens de serviço.</p>
            </div>
            <Link href="/dashboard/chamados">Ver todos <i className="ti ti-arrow-up-right" aria-hidden="true" /></Link>
          </div>

          <div className="nesher-filter-row">
            {statusFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={activeFilter === filter ? 'is-active' : ''}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
                {filter === 'Novos' && metrics.openTickets > 0 && <b>{metrics.openTickets}</b>}
              </button>
            ))}
          </div>

          <div className="nesher-ticket-list">
            {visibleTickets.map((ticket) => (
              <TicketRow
                ticket={ticket}
                key={ticket.id}
                onOpen={() => window.location.href = '/dashboard/chamados'}
              />
            ))}

            {visibleTickets.length === 0 && (
              <div style={{ textAlign: 'center', padding: '48px 16px', color: '#94a3b8' }}>
                <i className="ti ti-ticket" style={{ fontSize: '36px', display: 'block', marginBottom: '10px', opacity: 0.5 }} />
                <strong style={{ display: 'block', fontSize: '15px', color: '#334155', marginBottom: '4px' }}>
                  {tickets.length === 0 ? 'Nenhum chamado registrado (Base Zerada)' : 'Nenhum chamado neste filtro'}
                </strong>
                <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#64748b' }}>
                  {tickets.length === 0
                    ? 'A central de chamados está 100% limpa. Abra um novo chamado para começar.'
                    : 'Tente selecionar outro status acima.'}
                </p>
                {tickets.length === 0 && (
                  <button
                    type="button"
                    className="nesher-primary-button"
                    onClick={() => window.location.href = '/dashboard/chamados'}
                    style={{ margin: '0 auto' }}
                  >
                    <i className="ti ti-plus" />
                    <span>+ Abrir Primeiro Chamado</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {tickets.length > 4 && (
            <button
              type="button"
              className="nesher-load-more"
              onClick={() => setShowAll((value) => !value)}
            >
              {showAll ? 'Mostrar menos' : 'Carregar mais chamados'}{' '}
              <i className={'ti ' + (showAll ? 'ti-chevron-up' : 'ti-chevron-down')} aria-hidden="true" />
            </button>
          )}
        </div>

        <div className="nesher-side-stack">
          <div className="nesher-panel nesher-chart-panel">
            <div className="nesher-panel-header">
              <div>
                <h2>Volume de chamados</h2>
                <p>Últimos 7 dias</p>
              </div>
              <button className="nesher-select" type="button">Últimos 7 dias <i className="ti ti-chevron-down" aria-hidden="true" /></button>
            </div>
            <MiniChart count={tickets.length} />
          </div>

          <div className="nesher-panel nesher-sla-panel">
            <div className="nesher-panel-header">
              <div>
                <h2>SLA da operação</h2>
                <p>Visão dos prazos de atendimento</p>
              </div>
              <i className="ti ti-info-circle nesher-info" aria-hidden="true" />
            </div>
            <div className="nesher-sla-content">
              <div className="nesher-donut">
                <div>
                  <strong>{metrics.slaPct}%</strong>
                  <span>dentro do prazo</span>
                </div>
              </div>
              <div className="nesher-sla-legend">
                <span><i className="dot dot-green" />Dentro do prazo <b>{metrics.slaNormal}</b></span>
                <span><i className="dot dot-orange" />Próximo do vencimento <b>{metrics.slaWarning}</b></span>
                <span><i className="dot dot-red" />Fora do prazo <b>{metrics.slaBreached}</b></span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="nesher-quick-actions">
        <div><h2>Ações rápidas</h2><p>Atalhos diretos para os módulos do sistema.</p></div>
        <div className="nesher-action-list">
          <QuickAction icon="ti-building-community" title="Empresas Clientes" copy="Cadastros e aprovações" onClick={() => window.location.href = '/dashboard/empresas'} />
          <QuickAction icon="ti-devices" title="Inventário GLPI" copy="Equipamentos e patrimônio" onClick={() => window.location.href = '/dashboard/equipamentos'} />
          <QuickAction icon="ti-calendar-event" title="Visitas & Campo" copy="Agenda e suporte remoto" onClick={() => window.location.href = '/dashboard/visitas'} />
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon, label, value, detail, detailCopy, tone }: { icon: string; label: string; value: string; detail: string; detailCopy: string; tone: string }) {
  return (
    <div className="nesher-metric-card">
      <span className={'nesher-metric-icon ' + tone}>
        <i className={'ti ' + icon} aria-hidden="true" />
      </span>
      <div className="nesher-metric-main">
        <span>{label}</span>
        <strong>{value}</strong>
        <small className={tone === 'orange' ? 'is-muted' : ''}>
          <b>{detail}</b> {detailCopy}
        </small>
      </div>
    </div>
  );
}

function TicketRow({ ticket, onOpen }: { ticket: Ticket; onOpen: () => void }) {
  const code = ticket.code || ticket.id;
  const title = ticket.subject || ticket.title || 'Chamado sem assunto';
  const company = ticket.company || 'Empresa Cliente';
  const category = ticket.category || 'Suporte';
  const priority = ticket.priority || 'Média';
  const status = ticket.status || 'Novo';
  const time = ticket.createdAt || ticket.time || 'Hoje';
  const initials = company.slice(0, 2).toUpperCase();

  return (
    <button type="button" className="nesher-ticket-row" onClick={onOpen}>
      <span className="nesher-ticket-avatar blue">{initials}</span>
      <span className="nesher-ticket-main">
        <strong>{title}</strong>
        <span>{code} <i /> {company}</span>
      </span>
      <span className="nesher-ticket-category">{category}</span>
      <span className={'nesher-priority ' + priority.toLowerCase()}>
        <i />{priority}
      </span>
      <span className={'nesher-status ' + status.toLowerCase().replaceAll(' ', '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}>
        {status}
      </span>
      <span className="nesher-ticket-time">{time}</span>
      <i className="ti ti-chevron-right nesher-ticket-arrow" aria-hidden="true" />
    </button>
  );
}

function MiniChart({ count = 0 }: { count?: number }) {
  return (
    <div className="nesher-chart-wrap">
      <div className="nesher-chart-y">
        <span>20</span><span>15</span><span>10</span><span>5</span><span>0</span>
      </div>
      <div className="nesher-chart">
        <svg viewBox="0 0 540 150" preserveAspectRatio="none" role="img" aria-label="Volume de chamados nos últimos sete dias">
          <defs>
            <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#0b68d1" stopOpacity=".18" />
              <stop offset="1" stopColor="#0b68d1" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={count === 0
              ? "M0,140 L540,140 V150 H0 Z"
              : "M0,103 C26,96 42,105 67,82 S110,93 136,69 S175,75 204,87 S250,57 273,67 S308,47 340,58 S375,27 406,49 S445,41 472,59 S511,40 540,28 V150 H0 Z"
            }
            fill="url(#chartFill)"
          />
          <path
            d={count === 0
              ? "M0,140 L540,140"
              : "M0,103 C26,96 42,105 67,82 S110,93 136,69 S175,75 204,87 S250,57 273,67 S308,47 340,58 S375,27 406,49 S445,41 472,59 S511,40 540,28"
            }
            fill="none"
            stroke="#0b68d1"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <div className="nesher-chart-x">
          <span>Qui</span><span>Sex</span><span>Sáb</span><span>Dom</span><span>Seg</span><span>Ter</span><span>Hoje</span>
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon, title, copy, onClick }: { icon: string; title: string; copy: string; onClick: () => void }) {
  return (
    <button type="button" className="nesher-quick-action" onClick={onClick}>
      <span><i className={'ti ' + icon} aria-hidden="true" /></span>
      <strong>{title}</strong>
      <small>{copy}</small>
      <i className="ti ti-arrow-up-right" aria-hidden="true" />
    </button>
  );
}

