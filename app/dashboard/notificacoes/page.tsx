'use client';

import { useState, useEffect, useMemo } from 'react';
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filterTab, setFilterTab] = useState<'todas' | 'nao_lidas' | 'sla' | 'chamados'>('todas');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('nesher_notifications');
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications(defaultNotifications);
        window.localStorage.setItem('nesher_notifications', JSON.stringify(defaultNotifications));
      }
    } catch {
      setNotifications(defaultNotifications);
    }
  }, []);

  const persistNotifications = (updated: NotificationItem[]) => {
    setNotifications(updated);
    try {
      window.localStorage.setItem('nesher_notifications', JSON.stringify(updated));
      window.dispatchEvent(new Event('nesher_notifications_changed'));
    } catch {}
  };

  const markAllAsRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    persistNotifications(updated);
    showToast('Todas as notificações foram marcadas como lidas.');
  };

  const clearAllNotifications = () => {
    if (confirm('Deseja realmente limpar e apagar todas as notificações?')) {
      persistNotifications([]);
      showToast('Todas as notificações foram limpas com sucesso!');
    }
  };

  const removeSingleNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    persistNotifications(updated);
    showToast('Notificação removida.');
  };

  const resetDefaultNotifications = () => {
    persistNotifications(defaultNotifications);
    showToast('Notificações de exemplo restauradas.');
  };

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (filterTab === 'nao_lidas') return !n.read;
      if (filterTab === 'sla') return n.type === 'sla';
      if (filterTab === 'chamados') return n.type === 'ticket';
      return true;
    });
  }, [notifications, filterTab]);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#071A36',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'nesher-toast-in 0.2s ease-out',
          }}
        >
          <i className="ti ti-circle-check" style={{ color: '#10b981', fontSize: '18px' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="nesher-welcome-row">
        <div>
          <p className="nesher-eyebrow">CENTRAL DE ALERTAS &amp; COMUNICAÇÕES</p>
          <h1>Notificações do Sistema</h1>
          <p className="nesher-welcome-copy">
            Acompanhe avisos de vencimento de SLA, agendamentos de ordens de serviço e chamados recentes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {notifications.length > 0 && (
            <>
              <button
                type="button"
                className="nesher-select"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                style={{ opacity: unreadCount === 0 ? 0.6 : 1 }}
              >
                <i className="ti ti-checks" /> Marcar lidas ({unreadCount})
              </button>

              <button
                type="button"
                className="nesher-select"
                onClick={clearAllNotifications}
                style={{ color: '#dc2626', borderColor: '#fca5a5', background: '#fef2f2' }}
                title="Limpar e apagar todas as notificações para não acumular"
              >
                <i className="ti ti-trash" /> Limpar Notificações
              </button>
            </>
          )}

          {notifications.length === 0 && (
            <button type="button" className="nesher-select" onClick={resetDefaultNotifications}>
              <i className="ti ti-refresh" /> Restaurar Exemplos
            </button>
          )}
        </div>
      </div>

      {/* Tabs Filter */}
      {notifications.length > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <button
            type="button"
            className={`nesher-select ${filterTab === 'todas' ? 'is-active' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              background: filterTab === 'todas' ? '#0b68d1' : '#ffffff',
              color: filterTab === 'todas' ? '#ffffff' : '#334155',
            }}
            onClick={() => setFilterTab('todas')}
          >
            Todas ({notifications.length})
          </button>
          <button
            type="button"
            className={`nesher-select ${filterTab === 'nao_lidas' ? 'is-active' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              background: filterTab === 'nao_lidas' ? '#0b68d1' : '#ffffff',
              color: filterTab === 'nao_lidas' ? '#ffffff' : '#334155',
            }}
            onClick={() => setFilterTab('nao_lidas')}
          >
            Não Lidas ({unreadCount})
          </button>
          <button
            type="button"
            className={`nesher-select ${filterTab === 'sla' ? 'is-active' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              background: filterTab === 'sla' ? '#0b68d1' : '#ffffff',
              color: filterTab === 'sla' ? '#ffffff' : '#334155',
            }}
            onClick={() => setFilterTab('sla')}
          >
            Alertas de SLA
          </button>
          <button
            type="button"
            className={`nesher-select ${filterTab === 'chamados' ? 'is-active' : ''}`}
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: 700,
              background: filterTab === 'chamados' ? '#0b68d1' : '#ffffff',
              color: filterTab === 'chamados' ? '#ffffff' : '#334155',
            }}
            onClick={() => setFilterTab('chamados')}
          >
            Chamados
          </button>
        </div>
      )}

      {/* Notifications List */}
      <div className="nesher-panel" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="nesher-empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f0fdf4',
                color: '#16a34a',
                display: 'grid',
                placeItems: 'center',
                fontSize: '32px',
                margin: '0 auto 16px',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.15)',
              }}
            >
              <i className="ti ti-check" />
            </div>
            <strong style={{ fontSize: '16px', color: '#0f172a' }}>Tudo limpo por aqui!</strong>
            <p style={{ margin: '6px 0 20px', fontSize: '13px', color: '#64748b', maxWidth: '380px', marginLeft: 'auto', marginRight: 'auto' }}>
              Você não possui notificações pendentes ou acumuladas. Novos avisos de chamados e SLA aparecerão aqui.
            </p>
            {notifications.length === 0 && (
              <button
                type="button"
                className="nesher-select"
                style={{ margin: '0 auto' }}
                onClick={resetDefaultNotifications}
              >
                <i className="ti ti-refresh" /> Restaurar Alertas de Teste
              </button>
            )}
          </div>
        ) : (
          <div>
            {filtered.map((n) => (
              <div
                key={n.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  padding: '16px 20px',
                  borderBottom: '1px solid #edf2f7',
                  background: n.read ? '#ffffff' : '#f8faff',
                  transition: 'background 0.18s',
                }}
              >
                <div
                  style={{
                    width: '38px',
                    height: '38px',
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
                    <strong style={{ fontSize: '13.5px', color: n.read ? '#334155' : '#0f172a' }}>
                      {n.title}
                      {!n.read && (
                        <span
                          style={{
                            display: 'inline-block',
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: '#0b68d1',
                            marginLeft: '8px',
                          }}
                        />
                      )}
                    </strong>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{n.time}</span>
                  </div>
                  <p style={{ margin: '4px 0 8px', fontSize: '12px', color: '#64748b', lineHeight: 1.45 }}>
                    {n.description}
                  </p>
                  {n.link && (
                    <Link
                      href={n.link}
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#0b68d1',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      Acessar registro <i className="ti ti-chevron-right" />
                    </Link>
                  )}
                </div>

                {/* Individual Delete Action */}
                <button
                  type="button"
                  onClick={(e) => removeSingleNotification(n.id, e)}
                  title="Remover esta notificação"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '6px',
                    display: 'grid',
                    placeItems: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#dc2626';
                    e.currentTarget.style.background = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = '#94a3b8';
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <i className="ti ti-x" style={{ fontSize: '14px' }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
