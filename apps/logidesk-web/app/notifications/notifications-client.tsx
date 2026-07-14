'use client';

import { mutateLogiDesk, SupportNotification } from '@/src/lib/api';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function NotificationsClient({
  notifications,
}: {
  notifications: SupportNotification[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markRead(notificationId: string) {
    setPendingId(notificationId);
    setError(null);

    const result = await mutateLogiDesk(`/notifications/${notificationId}/read`, 'PATCH', {});

    setPendingId(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  if (notifications.length === 0) {
    return <p style={mutedStyle}>Nenhuma notificacao pendente.</p>;
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {error ? <p style={{ ...mutedStyle, color: 'var(--desk-danger)' }}>{error}</p> : null}
      {notifications.map((notification) => (
        <article key={notification.id} style={notificationStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
            <div>
              <p style={{ margin: 0, fontWeight: 800 }}>{notification.title}</p>
              <p style={mutedStyle}>{notification.body}</p>
            </div>
            <Badge value={notification.type} />
          </div>
          {notification.ticket ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              <Badge value={notification.ticket.number} />
              <Badge value={notification.ticket.status} />
              <Badge value={notification.ticket.priority} />
            </div>
          ) : null}
          <div style={footerStyle}>
            <p style={{ ...mutedStyle, margin: 0 }}>Criada em {formatDate(notification.createdAt)}</p>
            <button
              type="button"
              style={buttonStyle}
              disabled={pendingId === notification.id}
              onClick={() => void markRead(notification.id)}
            >
              {pendingId === notification.id ? 'Salvando...' : 'Marcar como lida'}
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function Badge({ value }: { value: string }) {
  return <span style={{ borderRadius: 999, background: 'var(--desk-surface-muted)', padding: '4px 8px', fontSize: 12, fontWeight: 800 }}>{value}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

const notificationStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, padding: 16, background: 'var(--desk-surface)' };
const footerStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' as const, marginTop: 12 };
const buttonStyle = {
  border: '1px solid var(--desk-border)',
  borderRadius: 8,
  background: 'var(--desk-text)',
  color: 'var(--desk-surface)',
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
};
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
