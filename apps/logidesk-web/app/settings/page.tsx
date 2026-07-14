import { fetchLogiDesk, SupportNotificationPreference } from '@/src/lib/api';
import { updateNotificationPreferencesAction } from './actions';

const settingsUserId = 'logidesk-web';

export default async function SettingsPage() {
  const preferenceResult = await fetchLogiDesk<SupportNotificationPreference>(`/notification-preferences/${settingsUserId}`);
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
const checkboxStyle = { display: 'flex', gap: 10, alignItems: 'center', color: 'var(--desk-text)', fontWeight: 700 };
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
