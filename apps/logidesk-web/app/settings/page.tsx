import { fetchLogiDesk, SupportCatalogItem, SupportNotificationPreference } from '@/src/lib/api';
import { SettingsClient } from './settings-client';

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
      <SettingsClient
        preferences={preferences}
        teams={teamsResult.data ?? []}
        categories={categoriesResult.data ?? []}
        tags={tagsResult.data ?? []}
        preferenceError={preferenceResult.error}
        teamsError={teamsResult.error}
        categoriesError={categoriesResult.error}
        tagsError={tagsResult.error}
      />
    </div>
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
