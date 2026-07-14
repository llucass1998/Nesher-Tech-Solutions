import Link from 'next/link';
import { fetchLogiDesk, TicketSummary } from '@/src/lib/api';
import { TicketActionsClient } from './ticket-actions-client';
import { TicketRealtimePanel } from './ticket-realtime-panel';

export default async function TicketDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const result = await fetchLogiDesk<TicketSummary>(`/tickets/${id}`);

  if (result.error || !result.data) {
    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <Link href="/tickets" style={linkStyle}>Voltar para chamados</Link>
        <section style={panelStyle}>
          <h2 style={{ margin: 0, color: 'var(--desk-danger)' }}>Chamado indisponivel</h2>
          <p style={mutedStyle}>{result.error ?? 'Chamado nao encontrado.'}</p>
        </section>
      </div>
    );
  }

  const ticket = result.data;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <Link href="/tickets" style={linkStyle}>Voltar para chamados</Link>
      <section style={panelStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: 'var(--desk-brand)', fontSize: 13, fontWeight: 800 }}>{ticket.number}</p>
            <h2 style={{ margin: '6px 0 0', fontSize: 28 }}>{ticket.subject}</h2>
            <p style={mutedStyle}>{ticket.description}</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Badge value={ticket.status} />
            <Badge value={ticket.priority} />
            <Badge value={ticket.source} />
          </div>
        </div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 20, alignItems: 'start' }}>
        <div style={{ display: 'grid', gap: 20 }}>
          <TicketRealtimePanel ticketId={ticket.id} />
          <TicketActionsClient ticket={ticket} />
          <section style={panelStyle}>
            <h3 style={sectionTitleStyle}>Mensagens</h3>
            {ticket.messages?.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {ticket.messages.map((message) => (
                  <article key={message.id} style={itemStyle}>
                    <p style={{ margin: 0, fontWeight: 800 }}>{message.authorRole}</p>
                    <p style={mutedStyle}>{message.body}</p>
                    <p style={dateStyle}>{formatDate(message.createdAt)}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p style={mutedStyle}>Nenhuma mensagem publica registrada.</p>
            )}
          </section>

          <section style={panelStyle}>
            <h3 style={sectionTitleStyle}>Historico</h3>
            {ticket.history?.length ? (
              <div style={{ display: 'grid', gap: 10 }}>
                {ticket.history.map((entry) => (
                  <article key={entry.id} style={itemStyle}>
                    <p style={{ margin: 0, fontWeight: 800 }}>{entry.action}</p>
                    <p style={dateStyle}>{formatDate(entry.createdAt)}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p style={mutedStyle}>Nenhum historico registrado.</p>
            )}
          </section>
        </div>

        <aside style={{ display: 'grid', gap: 20 }}>
          <section style={panelStyle}>
            <h3 style={sectionTitleStyle}>Contexto</h3>
            <Info label="Solicitante" value={ticket.requesterName ?? ticket.requesterEmail ?? '-'} />
            <Info label="Equipe" value={ticket.team?.name ?? ticket.teamId ?? '-'} />
            <Info label="Responsavel" value={ticket.assigneeId ?? '-'} />
            <Info label="Categoria" value={ticket.categoryRecord?.name ?? ticket.category ?? '-'} />
            <Info label="Entrega" value={ticket.deliveryId ?? '-'} />
            <Info label="Ocorrencia" value={ticket.occurrenceId ?? '-'} />
          </section>

          <section style={panelStyle}>
            <h3 style={sectionTitleStyle}>SLA</h3>
            <Info label="Status" value={ticket.sla?.status ?? '-'} />
            <Info label="Primeira resposta" value={ticket.sla?.firstResponseDueAt ? formatDate(ticket.sla.firstResponseDueAt) : '-'} />
            <Info label="Resolucao" value={ticket.sla?.resolutionDueAt ? formatDate(ticket.sla.resolutionDueAt) : '-'} />
          </section>

          <section style={panelStyle}>
            <h3 style={sectionTitleStyle}>Notas internas</h3>
            <p style={mutedStyle}>{ticket.notes?.length ?? 0} notas visiveis somente para suporte.</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ borderTop: '1px solid var(--desk-border)', padding: '10px 0' }}>
      <p style={{ margin: 0, color: 'var(--desk-muted)', fontSize: 12, fontWeight: 800 }}>{label}</p>
      <p style={{ margin: '4px 0 0', fontSize: 14 }}>{value}</p>
    </div>
  );
}

function Badge({ value }: { value: string }) {
  return <span style={{ borderRadius: 999, background: 'var(--desk-surface-muted)', padding: '5px 9px', fontSize: 12, fontWeight: 800 }}>{value}</span>;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

const panelStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const itemStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, padding: 12 };
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
const sectionTitleStyle = { margin: '0 0 12px', fontSize: 18 };
const dateStyle = { margin: '8px 0 0', color: 'var(--desk-muted)', fontSize: 12 };
const linkStyle = { color: 'var(--desk-brand)', fontWeight: 800 };
