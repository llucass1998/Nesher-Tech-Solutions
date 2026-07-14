import { fetchLogiDesk, SupportCatalogItem, SupportNotificationPreference } from '@/src/lib/api';
import {
  createCategoryAction,
  createTagAction,
  createTeamAction,
  deactivateCategoryAction,
  deactivateTagAction,
  deactivateTeamAction,
  updateNotificationPreferencesAction,
} from './actions';

const settingsUserId = 'logidesk-web';

export default async function SettingsPage() {
  const [preferenceResult, teamsResult, categoriesResult, tagsResult] = await Promise.all([
    fetchLogiDesk<SupportNotificationPreference>(`/notification-preferences/${settingsUserId}`),
    fetchLogiDesk<SupportCatalogItem[]>('/teams'),
    fetchLogiDesk<SupportCatalogItem[]>('/categories'),
    fetchLogiDesk<SupportCatalogItem[]>('/tags'),
  ]);
  const preferences = preferenceResult.data ?? defaultNotificationPreferences;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <section style={panelStyle}>
        <h2 style={{ margin: 0, fontSize: 28 }}>Configuracoes</h2>
        <p style={{ margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 14 }}>Regras de seguranca e integracao aplicadas ao LogiDesk.</p>
      </section>
      <section style={panelStyle}>
        <h3 style={{ margin: 0 }}>Guardrails ativos</h3>
        <ul style={{ margin: '14px 0 0', color: 'var(--desk-muted)', lineHeight: 1.8 }}>
          <li>Tickets vindos do LogiFlow exigem token de servico.</li>
          <li>Idempotency key impede duplicacao de chamados.</li>
          <li>Correlation ID acompanha ticket, mensagens, notas, auditoria e eventos.</li>
          <li>Suporte nao acessa diretamente o banco do LogiFlow.</li>
        </ul>
      </section>
      <section style={catalogGridStyle}>
        <CatalogPanel
          title="Equipes"
          description="Agrupam filas e responsaveis de atendimento."
          items={teamsResult.data ?? []}
          error={teamsResult.error}
          createAction={createTeamAction}
          deactivateAction={deactivateTeamAction}
          colorEnabled
        />
        <CatalogPanel
          title="Categorias"
          description="Classificam assunto, SLA e relatorios."
          items={categoriesResult.data ?? []}
          error={categoriesResult.error}
          createAction={createCategoryAction}
          deactivateAction={deactivateCategoryAction}
          colorEnabled
        />
        <CatalogPanel
          title="Tags"
          description="Sinalizam contexto operacional e urgencia."
          items={tagsResult.data ?? []}
          error={tagsResult.error}
          createAction={createTagAction}
          deactivateAction={deactivateTagAction}
          colorEnabled
        />
      </section>
      <section style={panelStyle}>
        <h3 style={{ margin: 0 }}>Preferencias de notificacao</h3>
        <p style={mutedStyle}>Controles operacionais preliminares ate o SSO do frontend usar o usuario real do LogiIdentity.</p>
        {preferenceResult.error ? <p style={{ ...mutedStyle, color: 'var(--desk-danger)' }}>{preferenceResult.error}</p> : null}
        <form action={updateNotificationPreferencesAction} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <input type="hidden" name="userId" value={settingsUserId} />
          <PreferenceCheckbox name="inAppEnabled" label="Receber notificacoes internas" checked={preferences.inAppEnabled} />
          <PreferenceCheckbox name="emailEnabled" label="Receber notificacoes por email" checked={preferences.emailEnabled} />
          <PreferenceCheckbox name="assignmentEnabled" label="Alertar atribuicoes de chamados" checked={preferences.assignmentEnabled} />
          <PreferenceCheckbox name="slaEnabled" label="Alertar riscos e violacoes de SLA" checked={preferences.slaEnabled} />
          <PreferenceCheckbox name="messageEnabled" label="Alertar novas mensagens" checked={preferences.messageEnabled} />
          <div>
            <button type="submit" style={buttonStyle}>
              Salvar preferencias
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function CatalogPanel({
  title,
  description,
  items,
  error,
  createAction,
  deactivateAction,
  colorEnabled = false,
}: {
  title: string;
  description: string;
  items: SupportCatalogItem[];
  error: string | undefined;
  createAction: (formData: FormData) => Promise<void>;
  deactivateAction: (formData: FormData) => Promise<void>;
  colorEnabled?: boolean;
}) {
  return (
    <section style={panelStyle}>
      <h3 style={{ margin: 0 }}>{title}</h3>
      <p style={mutedStyle}>{description}</p>
      {error ? <p style={{ ...mutedStyle, color: 'var(--desk-danger)' }}>{error}</p> : null}
      <form action={createAction} style={{ display: 'grid', gap: 10, marginTop: 16 }}>
        <input name="name" placeholder="Nome" required minLength={2} style={inputStyle} />
        <input name="description" placeholder="Descricao" style={inputStyle} />
        {colorEnabled ? <input name="color" placeholder="#0f766e" style={inputStyle} /> : null}
        <button type="submit" style={buttonStyle}>Adicionar</button>
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
              <form action={deactivateAction}>
                <input type="hidden" name="id" value={item.id} />
                <button type="submit" style={secondaryButtonStyle} disabled={!item.isActive}>
                  {item.isActive ? 'Desativar' : 'Inativo'}
                </button>
              </form>
            </div>
          ))
        )}
      </div>
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

const defaultNotificationPreferences = {
  id: 'default',
  userId: settingsUserId,
  inAppEnabled: true,
  emailEnabled: false,
  assignmentEnabled: true,
  slaEnabled: true,
  messageEnabled: true,
};

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
