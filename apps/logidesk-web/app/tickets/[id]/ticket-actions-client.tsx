'use client';

import { mutateLogiDesk, newCorrelationId, TicketSummary } from '@/src/lib/api';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

const statuses = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'RESOLVED', 'CLOSED', 'CANCELED'];
const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export function TicketActionsClient({ ticket }: { ticket: TicketSummary }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submitJson(path: string, method: 'POST' | 'PATCH', body: Record<string, unknown>, pendingKey: string) {
    setPending(pendingKey);
    setError(null);

    const result = await mutateLogiDesk(path, method, body);

    setPending(null);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  async function changeStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    await submitJson(`/tickets/${ticket.id}/status`, 'PATCH', {
      status: String(formData.get('status') ?? ''),
      reason: optionalString(formData.get('reason')),
      correlationId: newCorrelationId(),
      actorId: 'logidesk-web',
    }, 'status');
    form.reset();
  }

  async function changePriority(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    await submitJson(`/tickets/${ticket.id}/priority`, 'PATCH', {
      priority: String(formData.get('priority') ?? ''),
      reason: optionalString(formData.get('reason')),
      correlationId: newCorrelationId(),
      actorId: 'logidesk-web',
    }, 'priority');
  }

  async function createMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    await submitJson(`/tickets/${ticket.id}/messages`, 'POST', {
      authorId: 'logidesk-web',
      authorRole: 'SUPPORT',
      body: String(formData.get('body') ?? ''),
      correlationId: newCorrelationId(),
    }, 'message');
    form.reset();
  }

  async function createInternalNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    await submitJson(`/tickets/${ticket.id}/internal-notes`, 'POST', {
      authorId: 'logidesk-web',
      authorRole: 'SUPPORT',
      body: String(formData.get('body') ?? ''),
      correlationId: newCorrelationId(),
    }, 'note');
    form.reset();
  }

  return (
    <section style={panelStyle}>
      <h3 style={sectionTitleStyle}>Acoes do atendimento</h3>
      {error ? <p style={{ ...mutedStyle, color: 'var(--desk-danger)' }}>{error}</p> : null}
      <div style={gridStyle}>
        <form onSubmit={(event) => void changeStatus(event)} style={formStyle}>
          <label style={labelStyle}>
            <span>Status</span>
            <select name="status" defaultValue={ticket.status} style={inputStyle}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <input name="reason" placeholder="Motivo" style={inputStyle} />
          <button type="submit" style={buttonStyle} disabled={pending === 'status'}>
            {pending === 'status' ? 'Salvando...' : 'Alterar status'}
          </button>
        </form>

        <form onSubmit={(event) => void changePriority(event)} style={formStyle}>
          <label style={labelStyle}>
            <span>Prioridade</span>
            <select name="priority" defaultValue={ticket.priority} style={inputStyle}>
              {priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
          </label>
          <input name="reason" placeholder="Motivo" style={inputStyle} />
          <button type="submit" style={buttonStyle} disabled={pending === 'priority'}>
            {pending === 'priority' ? 'Salvando...' : 'Alterar prioridade'}
          </button>
        </form>
      </div>

      <div style={gridStyle}>
        <form onSubmit={(event) => void createMessage(event)} style={formStyle}>
          <label style={labelStyle}>
            <span>Resposta publica</span>
            <textarea name="body" required minLength={2} rows={4} style={textareaStyle} />
          </label>
          <button type="submit" style={buttonStyle} disabled={pending === 'message'}>
            {pending === 'message' ? 'Enviando...' : 'Responder'}
          </button>
        </form>

        <form onSubmit={(event) => void createInternalNote(event)} style={formStyle}>
          <label style={labelStyle}>
            <span>Nota interna</span>
            <textarea name="body" required minLength={2} rows={4} style={textareaStyle} />
          </label>
          <button type="submit" style={secondaryButtonStyle} disabled={pending === 'note'}>
            {pending === 'note' ? 'Salvando...' : 'Adicionar nota'}
          </button>
        </form>
      </div>
    </section>
  );
}

function optionalString(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : undefined;
}

const panelStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const sectionTitleStyle = { margin: '0 0 12px', fontSize: 18 };
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
const gridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginTop: 12 };
const formStyle = { display: 'grid', gap: 10, alignContent: 'start' };
const labelStyle = { display: 'grid', gap: 6, fontSize: 13, fontWeight: 800 };
const inputStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, padding: '10px 12px', fontSize: 14 };
const textareaStyle = { ...inputStyle, minHeight: 92, resize: 'vertical' as const };
const buttonStyle = {
  border: '1px solid var(--desk-border)',
  borderRadius: 8,
  background: 'var(--desk-text)',
  color: 'var(--desk-surface)',
  padding: '9px 14px',
  fontSize: 13,
  fontWeight: 800,
  cursor: 'pointer',
};
const secondaryButtonStyle = {
  ...buttonStyle,
  background: 'var(--desk-surface-muted)',
  color: 'var(--desk-text)',
};
