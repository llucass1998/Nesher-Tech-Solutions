import { fetchLogiDesk, SupportReportSummary } from '@/src/lib/api';

export default async function ReportsPage() {
  const result = await fetchLogiDesk<SupportReportSummary>('/reports/summary');
  const summary = result.data;
  const urgent = countByValue(summary?.ticketsByPriority, 'URGENT');
  const breached = countByValue(summary?.slaByStatus, 'BREACHED');
  const warning = countByValue(summary?.slaByStatus, 'WARNING');

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={panelStyle}>
        <h2 style={titleStyle}>Relatorios</h2>
        <p style={mutedStyle}>Indicadores consolidados de atendimento, prioridade, origem e SLA.</p>
      </section>
      {result.error ? <StateCard title="API indisponivel" message={result.error} /> : null}
      <section style={metricGridStyle}>
        <MetricCard label="Chamados totais" value={summary?.totals.tickets ?? 0} />
        <MetricCard label="Chamados ativos" value={summary?.totals.activeTickets ?? 0} />
        <MetricCard label="Sem responsavel" value={summary?.totals.unassignedTickets ?? 0} />
        <MetricCard label="Notificacoes pendentes" value={summary?.totals.unreadNotifications ?? 0} />
        <MetricCard label="Urgentes" value={urgent} tone={urgent > 0 ? 'warning' : 'neutral'} />
        <MetricCard label="SLA em risco" value={warning} tone={warning > 0 ? 'warning' : 'neutral'} />
        <MetricCard label="SLA violado" value={breached} tone={breached > 0 ? 'danger' : 'neutral'} />
      </section>
      {summary ? (
        <section style={summaryGridStyle}>
          <ReportGroup title="Distribuicao por status" items={summary.ticketsByStatus} />
          <ReportGroup title="Distribuicao por prioridade" items={summary.ticketsByPriority} />
          <ReportGroup title="Distribuicao por origem" items={summary.ticketsBySource} />
          <ReportGroup title="Distribuicao por SLA" items={summary.slaByStatus} />
        </section>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'warning' | 'danger' }) {
  const color = tone === 'danger' ? 'var(--desk-danger)' : tone === 'warning' ? 'var(--desk-warning)' : 'var(--desk-text)';

  return (
    <section style={panelStyle}>
      <p style={{ margin: 0, color: 'var(--desk-muted)', fontWeight: 700 }}>{label}</p>
      <p style={{ margin: '8px 0 0', color, fontSize: 34, fontWeight: 800 }}>{value}</p>
    </section>
  );
}

function ReportGroup({ title, items }: { title: string; items: Array<{ value: string; count: number }> }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <section style={panelStyle}>
      <h3 style={{ margin: 0, fontSize: 16 }}>{title}</h3>
      {items.length === 0 ? (
        <p style={mutedStyle}>Sem dados.</p>
      ) : (
        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          {items.map((item) => (
            <div key={item.value} style={{ display: 'grid', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ color: 'var(--desk-muted)', fontWeight: 700 }}>{item.value}</span>
                <strong>{item.count}</strong>
              </div>
              <div aria-hidden="true" style={barTrackStyle}>
                <div style={{ ...barFillStyle, width: `${percentage(item.count, total)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
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

function countByValue(items: Array<{ value: string; count: number }> | undefined, value: string) {
  return items?.find((item) => item.value === value)?.count ?? 0;
}

function percentage(count: number, total: number) {
  return total > 0 ? Math.max(4, Math.round((count / total) * 100)) : 0;
}

const panelStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const metricGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16 };
const summaryGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 };
const titleStyle = { margin: 0, fontSize: 28 };
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
const barTrackStyle = { height: 8, borderRadius: 999, background: 'var(--desk-surface-muted)', overflow: 'hidden' };
const barFillStyle = { height: '100%', borderRadius: 999, background: 'var(--desk-brand)' };
