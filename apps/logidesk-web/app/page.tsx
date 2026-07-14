import Link from 'next/link';
import { fetchLogiDesk, SupportReportSummary, TicketSummary } from '@/src/lib/api';

export default async function DashboardPage() {
  const [ticketsResult, summaryResult] = await Promise.all([
    fetchLogiDesk<TicketSummary[]>('/tickets'),
    fetchLogiDesk<SupportReportSummary>('/reports/summary'),
  ]);
  const tickets = ticketsResult.data ?? [];
  const summary = summaryResult.data;
  const urgent = countByValue(summary?.ticketsByPriority, 'URGENT');
  const breached = countByValue(summary?.slaByStatus, 'BREACHED');
  const apiError = summaryResult.error ?? ticketsResult.error;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={panelStyle}>
        <h2 style={titleStyle}>Dashboard</h2>
        <p style={mutedStyle}>Visao operacional dos chamados integrados e manuais.</p>
      </section>
      {apiError ? <StateCard title="API indisponivel" message={apiError} tone="danger" /> : null}
      <section style={metricGridStyle}>
        <MetricCard label="Chamados" value={summary?.totals.tickets ?? tickets.length} />
        <MetricCard label="Ativos" value={summary?.totals.activeTickets ?? 0} />
        <MetricCard label="Sem responsavel" value={summary?.totals.unassignedTickets ?? 0} />
        <MetricCard label="Notificacoes" value={summary?.totals.unreadNotifications ?? 0} />
        <MetricCard label="Urgentes" value={urgent} />
        <MetricCard label="SLA violado" value={breached} />
      </section>
      {summary ? (
        <section style={summaryGridStyle}>
          <SummaryList title="Status" items={summary.ticketsByStatus} />
          <SummaryList title="Prioridade" items={summary.ticketsByPriority} />
          <SummaryList title="Origem" items={summary.ticketsBySource} />
          <SummaryList title="SLA" items={summary.slaByStatus} />
        </section>
      ) : null}
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20 }}>Fila recente</h3>
            <p style={mutedStyle}>Ultimos chamados recebidos do LogiFlow e canais de suporte.</p>
          </div>
          <Link href="/tickets" style={buttonStyle}>Abrir fila</Link>
        </div>
        <TicketTable tickets={tickets.slice(0, 8)} />
      </section>
    </div>
  );
}

function SummaryList({ title, items }: { title: string; items: Array<{ value: string; count: number }> }) {
  return (
    <section style={panelStyle}>
      <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
      {items.length === 0 ? (
        <p style={mutedStyle}>Sem dados.</p>
      ) : (
        <div style={{ display: 'grid', gap: 10, marginTop: 12 }}>
          {items.map((item) => (
            <div key={item.value} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ color: 'var(--desk-muted)', fontWeight: 700 }}>{item.value}</span>
              <strong>{item.count}</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TicketTable({ tickets }: { tickets: TicketSummary[] }) {
  if (tickets.length === 0) {
    return <p style={{ ...mutedStyle, marginTop: 18 }}>Nenhum chamado encontrado.</p>;
  }

  return (
    <table style={{ width: '100%', marginTop: 18, fontSize: 14 }}>
      <thead>
        <tr style={{ color: 'var(--desk-muted)', textAlign: 'left' }}>
          <th style={cellStyle}>Numero</th>
          <th style={cellStyle}>Assunto</th>
          <th style={cellStyle}>Status</th>
          <th style={cellStyle}>Prioridade</th>
          <th style={cellStyle}>Origem</th>
        </tr>
      </thead>
      <tbody>
        {tickets.map((ticket) => (
          <tr key={ticket.id}>
            <td style={cellStyle}>{ticket.number}</td>
            <td style={cellStyle}>{ticket.subject}</td>
            <td style={cellStyle}><Badge value={ticket.status} /></td>
            <td style={cellStyle}><Badge value={ticket.priority} /></td>
            <td style={cellStyle}>{ticket.source}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <section style={panelStyle}>
      <p style={{ margin: 0, color: 'var(--desk-muted)', fontWeight: 700 }}>{label}</p>
      <p style={{ margin: '8px 0 0', fontSize: 34, fontWeight: 800 }}>{value}</p>
    </section>
  );
}

function StateCard({ title, message, tone }: { title: string; message: string; tone: 'danger' | 'warning' }) {
  return (
    <section style={panelStyle}>
      <h3 style={{ margin: 0, color: tone === 'danger' ? 'var(--desk-danger)' : 'var(--desk-warning)' }}>{title}</h3>
      <p style={mutedStyle}>{message}</p>
    </section>
  );
}

function Badge({ value }: { value: string }) {
  return <span style={{ borderRadius: 999, background: 'var(--desk-surface-muted)', padding: '4px 8px', fontSize: 12, fontWeight: 800 }}>{value}</span>;
}

function countByValue(items: Array<{ value: string; count: number }> | undefined, value: string) {
  return items?.find((item) => item.value === value)?.count ?? 0;
}

const panelStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const metricGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 };
const summaryGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 };
const titleStyle = { margin: 0, fontSize: 28 };
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
const cellStyle = { borderTop: '1px solid var(--desk-border)', padding: '12px 10px' };
const buttonStyle = { borderRadius: 8, background: 'var(--desk-brand)', color: 'white', padding: '10px 14px', fontWeight: 800 };
