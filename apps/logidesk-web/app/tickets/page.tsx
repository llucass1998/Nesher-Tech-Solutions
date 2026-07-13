import { fetchLogiDesk, TicketSummary } from '@/src/lib/api';

export default async function TicketsPage(props: { searchParams: Promise<{ view?: string; status?: string; priority?: string; search?: string }> }) {
  const searchParams = await props.searchParams;
  const query = new URLSearchParams();
  if (searchParams.status) query.set('status', searchParams.status);
  if (searchParams.priority) query.set('priority', searchParams.priority);
  if (searchParams.search) query.set('search', searchParams.search);

  const result = await fetchLogiDesk<TicketSummary[]>(`/tickets${query.size ? `?${query.toString()}` : ''}`);
  const tickets = result.data ?? [];

  if (searchParams.view === 'kanban') {
    return <Kanban tickets={tickets} {...(result.error ? { error: result.error } : {})} />;
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={panelStyle}>
        <h2 style={titleStyle}>Chamados</h2>
        <p style={mutedStyle}>Busca, filtros e leitura operacional dos tickets.</p>
      </section>
      {result.error ? <StateCard title="API indisponivel" message={result.error} /> : null}
      <section style={panelStyle}>
        {tickets.length === 0 ? (
          <p style={mutedStyle}>Nenhum chamado encontrado.</p>
        ) : (
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ color: 'var(--desk-muted)', textAlign: 'left' }}>
                <th style={cellStyle}>Numero</th>
                <th style={cellStyle}>Assunto</th>
                <th style={cellStyle}>Status</th>
                <th style={cellStyle}>Prioridade</th>
                <th style={cellStyle}>SLA</th>
                <th style={cellStyle}>Referencia</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td style={cellStyle}>{ticket.number}</td>
                  <td style={cellStyle}>{ticket.subject}</td>
                  <td style={cellStyle}><Badge value={ticket.status} /></td>
                  <td style={cellStyle}><Badge value={ticket.priority} /></td>
                  <td style={cellStyle}>{ticket.sla?.status ?? '-'}</td>
                  <td style={cellStyle}>{ticket.occurrenceId ?? ticket.deliveryId ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Kanban({ tickets, error }: { tickets: TicketSummary[]; error?: string }) {
  const columns = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED'];
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={panelStyle}>
        <h2 style={titleStyle}>Kanban</h2>
        <p style={mutedStyle}>Chamados por status com contexto de prioridade e origem.</p>
      </section>
      {error ? <StateCard title="API indisponivel" message={error} /> : null}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(180px, 1fr))', gap: 14 }}>
        {columns.map((column) => (
          <div key={column} style={panelStyle}>
            <h3 style={{ margin: 0, fontSize: 15 }}>{column}</h3>
            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              {tickets.filter((ticket) => ticket.status === column).map((ticket) => (
                <article key={ticket.id} style={{ border: '1px solid var(--desk-border)', borderRadius: 8, padding: 12 }}>
                  <p style={{ margin: 0, fontWeight: 800 }}>{ticket.number}</p>
                  <p style={{ ...mutedStyle, marginTop: 4 }}>{ticket.subject}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <Badge value={ticket.priority} />
                    <Badge value={ticket.source} />
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
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

const panelStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const titleStyle = { margin: 0, fontSize: 28 };
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
const cellStyle = { borderTop: '1px solid var(--desk-border)', padding: '12px 10px' };
