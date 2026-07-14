import { fetchLogiDesk, SupportNotification } from '@/src/lib/api';

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
        {notifications.length === 0 ? (
          <p style={mutedStyle}>Nenhuma notificacao pendente.</p>
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
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
                <p style={{ ...mutedStyle, marginTop: 12 }}>Criada em {formatDate(notification.createdAt)}</p>
              </article>
            ))}
          </div>
        )}
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

function Badge({ value }: { value: string }) {
  return <span style={{ borderRadius: 999, background: 'var(--desk-surface-muted)', padding: '4px 8px', fontSize: 12, fontWeight: 800 }}>{value}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

const panelStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const notificationStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, padding: 16, background: 'var(--desk-surface)' };
const titleStyle = { margin: 0, fontSize: 28 };
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
