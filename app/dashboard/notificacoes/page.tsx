'use client';

import { useState } from 'react';
import Link from 'next/link';

interface NotificationItem {
  id: string;
  type: 'ticket' | 'sla' | 'visit' | 'system';
  title: string;
  description: string;
  time: string;
  read: boolean;
  link?: string;
}

const defaultNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    type: 'sla',
    title: 'Alerta de SLA: Chamado Próximo ao Limite (80%)',
    description: 'O chamado NS-2026-0031 de prioridade Alta atinge o prazo contratual em 25 minutos.',
    time: 'Há 12 minutos',
    read: false,
    link: '/dashboard/chamados',
  },
  {
    id: 'notif-2',
    type: 'visit',
    title: 'Visita Técnica de Campo Agendada',
    description: 'OS-0084 agendada com sucesso para amanhã às 14:00 na Matriz do cliente.',
    time: 'Há 1 hora',
    read: false,
    link: '/dashboard/visitas',
  },
  {
    id: 'notif-3',
    type: 'ticket',
    title: 'Novo Chamado Aberto via Portal do Usuário',
    description: 'Solicitação aberta por Roberto Silva: Falha no enlace de fibra ótica.',
    time: 'Há 3 horas',
    read: true,
    link: '/dashboard/chamados',
  },
];

export default function NotificacoesPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(defaultNotifications);

  const markAllAsRead = () => {
    setNotifications(notifications.map((n) => ({ ...n, read: true })));
  };

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'sla':
        return <i className="ti ti-alert-triangle" style={{ color: '#ea580c' }} />;
      case 'visit':
        return <i className="ti ti-calendar-event" style={{ color: '#0b68d1' }} />;
      case 'ticket':
        return <i className="ti ti-message-circle" style={{ color: '#7c3aed' }} />;
      default:
        return <i className="ti ti-bell" style={{ color: '#0284c7' }} />;
    }
  };

  return (
    <div className="nesher-dashboard">
      <div className="nesher-welcome-row">
        <div>
          <p className="nesher-eyebrow">CENTRAL DE ALERTAS &amp; COMUNICAÇÕES</p>
          <h1>Notificações do Sistema</h1>
          <p className="nesher-welcome-copy">
            Acompanhe avisos de vencimento de SLA, agendamentos de ordens de serviço e mensagens recebidas.
          </p>
        </div>

        <button type="button" className="nesher-select" onClick={markAllAsRead}>
          <i className="ti ti-checks" /> Marcar todas como lidas
        </button>
      </div>

      <div className="nesher-panel" style={{ overflow: 'hidden' }}>
        {notifications.length === 0 ? (
          <div className="nesher-empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
            <i className="ti ti-bell-off" style={{ fontSize: '36px', color: '#94a3b8', display: 'block', marginBottom: '10px' }} />
            <strong>Nenhuma notificação recente</strong>
          </div>
        ) : (
          <div>
            {notifications.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '16px 20px',
                  borderBottom: '1px solid #edf2f7',
                  background: n.read ? '#ffffff' : '#f8faff',
                  transition: 'background 0.18s',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: '#f1f5f9',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '18px',
                    flexShrink: 0,
                  }}
                >
                  {getIcon(n.type)}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <strong style={{ fontSize: '13px', color: n.read ? '#334155' : '#0f172a' }}>{n.title}</strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{n.time}</span>
                  </div>
                  <p style={{ margin: '4px 0 8px', fontSize: '12px', color: '#64748b' }}>{n.description}</p>
                  {n.link && (
                    <Link
                      href={n.link}
                      style={{ fontSize: '11px', fontWeight: 700, color: '#0b68d1', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      Acessar registro <i className="ti ti-chevron-right" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
