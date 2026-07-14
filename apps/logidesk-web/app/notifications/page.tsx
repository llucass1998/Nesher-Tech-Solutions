import { fetchLogiDesk, SupportNotification } from '@/src/lib/api';
import { NotificationsClient } from './notifications-client';

export default async function NotificationsPage() {
  const result = await fetchLogiDesk<SupportNotification[]>('/notifications?unread=true');
  const notifications = result.data ?? [];

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={panelStyle}>
        <h2 style={titleStyle}>Notificacoes</h2>
        <p style={mutedStyle}>Alertas operacionais gerados por atribuicoes, SLA e eventos da fila de suporte.</p>
      </section>
      {result.error ? <StateCard title="API indisponivel" message={result.error} /> : null}
      <section style={panelStyle}>
        <NotificationsClient notifications={notifications} />
      </section>
    </div>
  );
}

function StateCard({ title, message }: { title: string; message: string }) {
  return (
    <section style={panelStyle}>
      <h3 style={{ margin: 0, color: 'var(--desk-danger)' }}>{title}</h3>
      <p style={mutedStyle}>{message}</p>
    </section>
  );
}

const panelStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const titleStyle = { margin: 0, fontSize: 28 };
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
