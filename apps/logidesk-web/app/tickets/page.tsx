import Link from 'next/link';
import { fetchLogiDesk, TicketSummary } from '@/src/lib/api';
import { KanbanBoard } from '@/src/components/KanbanBoard';
import { TicketStatusBadge, PriorityBadge } from '@logipeople/ui';

export default async function TicketsPage(props: { searchParams: Promise<{ view?: string; status?: string; priority?: string; search?: string }> }) {
  const searchParams = await props.searchParams;
  const query = new URLSearchParams();
  if (searchParams.status) query.set('status', searchParams.status);
  if (searchParams.priority) query.set('priority', searchParams.priority);
  if (searchParams.search) query.set('search', searchParams.search);

  const result = await fetchLogiDesk<TicketSummary[]>(`/tickets${query.size ? `?${query.toString()}` : ''}`);
  const tickets = result.data ?? [];

  if (searchParams.view === 'kanban') {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <section style={panelStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={titleStyle}>Kanban</h2>
              <p style={mutedStyle}>Chamados por status com contexto de prioridade e origem.</p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/tickets?view=list" style={buttonStyle(false)}>Lista</Link>
              <Link href="/tickets?view=kanban" style={buttonStyle(true)}>Kanban</Link>
            </div>
          </div>
          <form action="/tickets" method="GET" style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <input type="hidden" name="view" value="kanban" />
            <input type="text" name="search" placeholder="Buscar chamado..." defaultValue={searchParams.search} style={inputStyle} />
            <select name="status" defaultValue={searchParams.status} style={inputStyle}>
              <option value="">Todos os status</option>
              <option value="OPEN">Aberto</option>
              <option value="IN_PROGRESS">Em andamento</option>
              <option value="WAITING_CUSTOMER">Aguardando cliente</option>
              <option value="WAITING_INTERNAL">Aguardando equipe</option>
              <option value="RESOLVED">Resolvido</option>
              <option value="CLOSED">Fechado</option>
              <option value="CANCELED">Cancelado</option>
            </select>
            <select name="priority" defaultValue={searchParams.priority} style={inputStyle}>
              <option value="">Qualquer prioridade</option>
              <option value="LOW">Baixa</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">Alta</option>
              <option value="URGENT">Urgente</option>
            </select>
            <button type="submit" style={submitStyle}>Filtrar</button>
          </form>
        </section>
        {result.error && <StateCard title="API indisponivel" message={result.error} />}
        <KanbanBoard initialTickets={tickets} />
      </div>
    );
  }

  
  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={titleStyle}>Chamados</h2>
            <p style={mutedStyle}>Busca, filtros e leitura operacional dos tickets.</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link href="/tickets?view=list" style={buttonStyle(searchParams.view !== 'kanban')}>Lista</Link>
            <Link href="/tickets?view=kanban" style={buttonStyle(searchParams.view === 'kanban')}>Kanban</Link>
          </div>
        </div>
        
        <form action="/tickets" method="GET" style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          {searchParams.view === 'kanban' && <input type="hidden" name="view" value="kanban" />}
          <input 
            type="text" 
            name="search" 
            placeholder="Buscar chamado..." 
            defaultValue={searchParams.search}
            style={inputStyle}
          />
          <select name="status" defaultValue={searchParams.status} style={inputStyle}>
            <option value="">Todos os status</option>
            <option value="OPEN">Aberto</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="WAITING_CUSTOMER">Aguardando cliente</option>
            <option value="WAITING_INTERNAL">Aguardando equipe</option>
            <option value="RESOLVED">Resolvido</option>
            <option value="CLOSED">Fechado</option>
            <option value="CANCELED">Cancelado</option>
          </select>
          <select name="priority" defaultValue={searchParams.priority} style={inputStyle}>
            <option value="">Qualquer prioridade</option>
            <option value="LOW">Baixa</option>
            <option value="NORMAL">Normal</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
          <button type="submit" style={submitStyle}>Filtrar</button>
        </form>
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
                  <td style={cellStyle}>
                    <Link href={`/tickets/${ticket.id}`} style={linkStyle}>{ticket.number}</Link>
                  </td>
                  <td style={cellStyle}>
                    <Link href={`/tickets/${ticket.id}`} style={linkStyle}>{ticket.subject}</Link>
                  </td>
                  <td style={cellStyle}><TicketStatusBadge status={ticket.status} /></td>
                  <td style={cellStyle}><PriorityBadge priority={ticket.priority} /></td>
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



function StateCard({ title, message }: { title: string; message: string }) {
  return (
    <section style={panelStyle}>
      <h3 style={{ margin: 0, color: 'var(--desk-danger)' }}>{title}</h3>
      <p style={mutedStyle}>{message}</p>
    </section>
  );
}




const inputStyle = {
  border: '1px solid var(--desk-border)',
  borderRadius: 6,
  padding: '8px 12px',
  fontSize: 14,
  outline: 'none',
  minWidth: 150
};
const submitStyle = {
  background: 'var(--desk-brand)',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  padding: '8px 16px',
  fontWeight: 600,
  cursor: 'pointer'
};
const buttonStyle = (active: boolean) => ({
  background: active ? 'var(--desk-brand)' : 'var(--desk-surface-muted)',
  color: active ? 'white' : 'var(--desk-muted)',
  padding: '6px 12px',
  borderRadius: 6,
  fontSize: 13,
  fontWeight: 600,
  textDecoration: 'none'
});

const panelStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const titleStyle = { margin: 0, fontSize: 28 };
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
const cellStyle = { borderTop: '1px solid var(--desk-border)', padding: '12px 10px' };
const linkStyle = { color: 'var(--desk-brand)', fontWeight: 800 };
