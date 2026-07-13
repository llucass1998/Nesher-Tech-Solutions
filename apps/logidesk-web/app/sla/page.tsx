import { fetchLogiDesk, TicketSummary } from '@/src/lib/api';

export default async function SlaPage() {
  const result = await fetchLogiDesk<TicketSummary[]>('/tickets');
  const tickets = result.data ?? [];
  const watched = tickets.filter((ticket) => ticket.sla);

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={panelStyle}>
        <h2 style={titleStyle}>SLA</h2>
        <p style={mutedStyle}>Prazos de primeira resposta e resolucao por ticket.</p>
      </section>
      {result.error ? (
        <section style={panelStyle}>
          <h3 style={{ margin: 0, color: 'var(--desk-danger)' }}>API indisponivel</h3>
          <p style={mutedStyle}>{result.error}</p>
        </section>
      ) : null}
      <section style={panelStyle}>
        {watched.length === 0 ? (
          <p style={mutedStyle}>Nenhum SLA encontrado.</p>
        ) : (
          <table style={{ width: '100%', fontSize: 14 }}>
            <thead>
              <tr style={{ color: 'var(--desk-muted)', textAlign: 'left' }}>
                <th style={cellStyle}>Chamado</th>
                <th style={cellStyle}>Status SLA</th>
                <th style={cellStyle}>Primeira resposta</th>
                <th style={cellStyle}>Resolucao</th>
              </tr>
            </thead>
            <tbody>
              {watched.map((ticket) => (
                <tr key={ticket.id}>
                  <td style={cellStyle}>{ticket.number}</td>
                  <td style={cellStyle}>{ticket.sla?.status}</td>
                  <td style={cellStyle}>{formatDate(ticket.sla?.firstResponseDueAt)}</td>
                  <td style={cellStyle}>{formatDate(ticket.sla?.resolutionDueAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '-';
}

const panelStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const titleStyle = { margin: 0, fontSize: 28 };
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
const cellStyle = { borderTop: '1px solid var(--desk-border)', padding: '12px 10px' };
