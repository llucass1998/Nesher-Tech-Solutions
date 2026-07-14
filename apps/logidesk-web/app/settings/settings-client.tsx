'use client';

import {
  mutateLogiDesk,
  newCorrelationId,
  SupportCatalogItem,
  SupportNotificationPreference,
} from '@/src/lib/api';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

export function SettingsClient({
  preferences,
  teams,
  categories,
  tags,
  preferenceError,
  teamsError,
  categoriesError,
  tagsError,
}: {
  preferences: SupportNotificationPreference;
  teams: SupportCatalogItem[];
  categories: SupportCatalogItem[];
  tags: SupportCatalogItem[];
  preferenceError?: string | undefined;
  teamsError?: string | undefined;
  categoriesError?: string | undefined;
  tagsError?: string | undefined;
}) {
  return (
    <>
      <section style={catalogGridStyle}>
        <CatalogPanel title="Equipes" description="Agrupam filas e responsaveis de atendimento." items={teams} error={teamsError} path="/teams" colorEnabled />
        <CatalogPanel title="Categorias" description="Classificam assunto, SLA e relatorios." items={categories} error={categoriesError} path="/categories" colorEnabled />
        <CatalogPanel title="Tags" description="Sinalizam contexto operacional e urgencia." items={tags} error={tagsError} path="/tags" colorEnabled />
      </section>
      <NotificationPreferencesPanel preferences={preferences} error={preferenceError} />
    </>
  );
}

function CatalogPanel({
  title,
  description,
  items,
  error,
  path,
  colorEnabled = false,
}: {
  title: string;
  description: string;
  items: SupportCatalogItem[];
  error: string | undefined;
  path: '/teams' | '/categories' | '/tags';
  colorEnabled?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function createItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setActionError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = await mutateLogiDesk(path, 'POST', {
      name: String(formData.get('name') ?? ''),
      description: optionalString(formData.get('description')),
      color: optionalString(formData.get('color')),
      correlationId: newCorrelationId(),
      actorId: 'logidesk-web',
    });

    setPending(false);

    if (result.error) {
      setActionError(result.error);
      return;
    }

    form.reset();
    router.refresh();
  }

  async function deactivateItem(id: string) {
    setPending(true);
    setActionError(null);

    const result = await mutateLogiDesk(`${path}/${id}`, 'DELETE', {
      correlationId: newCorrelationId(),
      actorId: 'logidesk-web',
    });

    setPending(false);

    if (result.error) {
      setActionError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <section style={panelStyle}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p style={mutedStyle}>{description}</p>
      {error ? <p style={{ ...mutedStyle, color: 'var(--desk-danger)' }}>{error}</p> : null}
      {actionError ? <p style={{ ...mutedStyle, color: 'var(--desk-danger)' }}>{actionError}</p> : null}
      <form onSubmit={(event) => void createItem(event)} style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        <input name="name" placeholder="Nome" required minLength={2} style={inputStyle} />
        <input name="description" placeholder="Descricao" style={inputStyle} />
        {colorEnabled ? <input name="color" placeholder="#0f766e" style={inputStyle} /> : null}
        <button type="submit" style={buttonStyle} disabled={pending}>{pending ? 'Salvando...' : 'Adicionar'}</button>
      </form>
      <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        {items.length === 0 ? (
          <p style={mutedStyle}>Nenhum item cadastrado.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} style={catalogItemStyle}>
              <div>
                <p style={{ margin: 0, fontWeight: 800 }}>{item.name}</p>
                {item.description ? <p style={mutedStyle}>{item.description}</p> : null}
              </div>
              <button
                type="button"
                style={secondaryButtonStyle}
                disabled={!item.isActive || pending}
                onClick={() => void deactivateItem(item.id)}
              >
                {item.isActive ? 'Desativar' : 'Inativo'}
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function NotificationPreferencesPanel({
  preferences,
  error,
}: {
  preferences: SupportNotificationPreference;
  error?: string | undefined;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  async function updatePreferences(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setActionError(null);

    const formData = new FormData(event.currentTarget);
    const userId = preferences.userId;
    const result = await mutateLogiDesk(`/notification-preferences/${userId}`, 'PATCH', {
      inAppEnabled: formData.has('inAppEnabled'),
      emailEnabled: formData.has('emailEnabled'),
      assignmentEnabled: formData.has('assignmentEnabled'),
      slaEnabled: formData.has('slaEnabled'),
      messageEnabled: formData.has('messageEnabled'),
      correlationId: newCorrelationId(),
      actorId: userId,
    });

    setPending(false);

    if (result.error) {
      setActionError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <section style={panelStyle}>
      <h3 style={{ margin: 0 }}>Preferencias de notificacao</h3>
      <p style={mutedStyle}>Controles operacionais preliminares ate o SSO do frontend usar o usuario real do LogiIdentity.</p>
      {error ? <p style={{ ...mutedStyle, color: 'var(--desk-danger)' }}>{error}</p> : null}
      {actionError ? <p style={{ ...mutedStyle, color: 'var(--desk-danger)' }}>{actionError}</p> : null}
      <form onSubmit={(event) => void updatePreferences(event)} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
        <PreferenceCheckbox name="inAppEnabled" label="Receber notificacoes internas" checked={preferences.inAppEnabled} />
        <PreferenceCheckbox name="emailEnabled" label="Receber notificacoes por email" checked={preferences.emailEnabled} />
        <PreferenceCheckbox name="assignmentEnabled" label="Alertar atribuicoes de chamados" checked={preferences.assignmentEnabled} />
        <PreferenceCheckbox name="slaEnabled" label="Alertar riscos e violacoes de SLA" checked={preferences.slaEnabled} />
        <PreferenceCheckbox name="messageEnabled" label="Alertar novas mensagens" checked={preferences.messageEnabled} />
        <div>
          <button type="submit" style={buttonStyle} disabled={pending}>
            {pending ? 'Salvando...' : 'Salvar preferencias'}
          </button>
        </div>
      </form>
    </section>
  );
}

function PreferenceCheckbox({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return (
    <label style={checkboxStyle}>
      <input type="checkbox" name={name} defaultChecked={checked} />
      <span>{label}</span>
    </label>
  );
}

function optionalString(value: FormDataEntryValue | null) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length > 0 ? text : undefined;
}

const panelStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const mutedStyle = { margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 };
const catalogGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 };
const catalogItemStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', border: '1px solid var(--desk-border)', borderRadius: 8, padding: 12 };
const checkboxStyle = { display: 'flex', gap: 10, alignItems: 'center', color: 'var(--desk-text)', fontWeight: 700 };
const inputStyle = { border: '1px solid var(--desk-border)', borderRadius: 8, padding: '10px 12px', fontSize: 14 };
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
