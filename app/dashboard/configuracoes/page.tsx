'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface CompanySettings {
  scope: 'global' | string;
  companyName: string;
  corporateName: string;
  cnpj: string;
  supportPhone: string;
  supportEmail: string;
  city: string;
  state: string;
  logoUrl: string;
  whiteLabelFooter: string;
  
  // Visual & Colors
  primaryColor: string;
  sidebarBg: string;
  themeMode: 'light' | 'dark' | 'auto';
  uiDensity: 'compact' | 'normal' | 'spacious';
  borderRadius: string;

  // Sidebar behavior & permissions
  defaultSidebarState: 'pinned' | 'collapsed';
  visibleModules: {
    dashboard: boolean;
    indicadores: boolean;
    chamados: boolean;
    visitas: boolean;
    empresas: boolean;
    funcionarios: boolean;
    unidades: boolean;
    equipamentos: boolean;
    comunicacao: boolean;
    respostasRapidas: boolean;
    notificacoes: boolean;
    tecnicos: boolean;
    permissoes: boolean;
  };

  // Dashboard & Widgets
  widgets: {
    topMetrics: boolean;
    ticketChart: boolean;
    slaDonut: boolean;
    fieldVisits: boolean;
    onlineTechnicians: boolean;
    quickActions: boolean;
  };

  // Ticket & Support configs
  supportHours: string;
  categories: string[];
  protocolFormat: string;
  allowAttachments: boolean;
  maxAttachmentSizeMb: number;

  // SLA
  slaPrazos: {
    critica: { resposta: string; solucao: string };
    alta: { resposta: string; solucao: string };
    media: { resposta: string; solucao: string };
    baixa: { resposta: string; solucao: string };
  };
  slaSchedule: 'commercial' | '24x7';

  // Notifications
  notifications: {
    systemBell: boolean;
    emailAlerts: boolean;
    whatsappAlerts: boolean;
    slaWarning: boolean;
  };

  // Remote Access
  remoteTool: 'rustdesk' | 'anydesk' | 'teamviewer' | 'webrtc';
  remoteInstructions: string;
}

const defaultGlobalSettings: CompanySettings = {
  scope: 'global',
  companyName: 'Nesher Tech Solutions',
  corporateName: 'Nesher Soluções em Tecnologia e Segurança LTDA',
  cnpj: '38.452.190/0001-82',
  supportPhone: '(11) 4003-8921',
  supportEmail: 'suporte@neshertech.com.br',
  city: 'São Paulo',
  state: 'SP',
  logoUrl: '/nesher-emblem.png',
  whiteLabelFooter: 'Desenvolvido por Nesher Tech Solutions • Todos os direitos reservados',

  primaryColor: '#0b68d1',
  sidebarBg: '#071A36',
  themeMode: 'light',
  uiDensity: 'normal',
  borderRadius: '10px',

  defaultSidebarState: 'pinned',
  visibleModules: {
    dashboard: true,
    indicadores: true,
    chamados: true,
    visitas: true,
    empresas: true,
    funcionarios: true,
    unidades: true,
    equipamentos: true,
    comunicacao: true,
    respostasRapidas: true,
    notificacoes: true,
    tecnicos: true,
    permissoes: true,
  },

  widgets: {
    topMetrics: true,
    ticketChart: true,
    slaDonut: true,
    fieldVisits: true,
    onlineTechnicians: true,
    quickActions: true,
  },

  supportHours: 'Segunda a Sexta das 08:00 às 18:00 (NOC 24/7 para emergências)',
  categories: [
    'Hardware & Estações',
    'Redes, Roteadores & Wi-Fi',
    'Software, ERP & Sistema',
    'Acesso, Senhas & Contas',
    'CFTV & Monitoramento',
    'Telefonia IP & Voz',
    'Backup & Nuvem',
  ],
  protocolFormat: 'NS-{YYYY}-{NUM}',
  allowAttachments: true,
  maxAttachmentSizeMb: 25,

  slaPrazos: {
    critica: { resposta: '15 min', solucao: '2 horas' },
    alta: { resposta: '1 hora', solucao: '8 horas' },
    media: { resposta: '4 horas', solucao: '24 horas' },
    baixa: { resposta: '8 horas', solucao: '48 horas' },
  },
  slaSchedule: 'commercial',

  notifications: {
    systemBell: true,
    emailAlerts: true,
    whatsappAlerts: true,
    slaWarning: true,
  },

  remoteTool: 'rustdesk',
  remoteInstructions: 'Baixe o assistente remoto Nesher Tech e informe a ID e a chave numérica temporária ao técnico do NOC.',
};

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState<
    'identidade' | 'visual' | 'lateral' | 'widgets' | 'chamados' | 'sla' | 'notificacoes' | 'remoto'
  >('identidade');

  const [settings, setSettings] = useState<CompanySettings>(defaultGlobalSettings);
  const [initialSettings, setInitialSettings] = useState<CompanySettings>(defaultGlobalSettings);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string; slaPlan?: string }>>([]);
  const [selectedScope, setSelectedScope] = useState<'global' | string>('global');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Available Color Palettes
  const primaryColors = [
    { name: 'Azul Nesher Tech', hex: '#0b68d1' },
    { name: 'Azul Marinho Real', hex: '#071a36' },
    { name: 'Esmeralda Digital', hex: '#0d9488' },
    { name: 'Violeta Tecnológico', hex: '#7c3aed' },
    { name: 'Grafite Corporativo', hex: '#1e293b' },
    { name: 'Rubi Crítico', hex: '#dc2626' },
  ];

  const sidebarBgs = [
    { name: 'Navy Clássico Nesher', hex: '#071A36' },
    { name: 'Azul Meia-Noite Profundo', hex: '#0A1330' },
    { name: 'Deep Sapphire', hex: '#0c1f38' },
    { name: 'Preto Ônix Puro', hex: '#061325' },
    { name: 'Dark Slate Modern', hex: '#111827' },
    { name: 'Floresta Escuro', hex: '#022c22' },
  ];

  useEffect(() => {
    try {
      const rawComp = window.localStorage.getItem('nesher_companies');
      if (rawComp) {
        const parsed = JSON.parse(rawComp);
        if (Array.isArray(parsed)) {
          const approved = parsed
            .filter((c: any) => c.status === 'Aprovada' && !['comp-1', 'comp-2', 'comp-3', 'comp-4', 'comp-5', 'comp-6'].includes(c.id))
            .map((c: any) => ({
              id: c.id,
              name: c.tradeName || c.corporateName,
              slaPlan: c.slaPlan || 'SLA Padrão',
            }));
          setCompanies(approved);
        }
      }

      const rawSettings = window.localStorage.getItem('nesher_custom_settings');
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
        setInitialSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {}
  }, []);

  // Track changes to show floating save bar
  const updateSettings = (newVal: Partial<CompanySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...newVal };
      setHasChanges(JSON.stringify(next) !== JSON.stringify(initialSettings));
      return next;
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSave = () => {
    try {
      window.localStorage.setItem('nesher_custom_settings', JSON.stringify(settings));
      setInitialSettings(settings);
      setHasChanges(false);

      if (settings.sidebarBg) {
        document.documentElement.style.setProperty('--company-sidebar-bg', settings.sidebarBg);
      }
      showToast('Configurações salvas e aplicadas em tempo real com sucesso!');
    } catch {
      showToast('Erro ao gravar configurações no armazenamento local.');
    }
  };

  const handleDiscard = () => {
    setSettings(initialSettings);
    setHasChanges(false);
    showToast('Alterações descartadas.');
  };

  const handleResetDefaults = () => {
    setSettings(defaultGlobalSettings);
    setInitialSettings(defaultGlobalSettings);
    setHasChanges(false);
    try {
      window.localStorage.setItem('nesher_custom_settings', JSON.stringify(defaultGlobalSettings));
      document.documentElement.style.removeProperty('--company-sidebar-bg');
    } catch {}
    showToast('Configurações restauradas para o padrão global da Nesher Tech.');
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const selectedCompanyName = companies.find((c) => c.id === selectedScope)?.name || 'Empresa Cliente';
  const selectedCompanySLA = companies.find((c) => c.id === selectedScope)?.slaPlan || 'SLA Básico';

  return (
    <div className="nesher-settings-page">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="nesher-toast">
          <i className="ti ti-circle-check" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Elite Scope Control Deck */}
      <div className="nesher-scope-card">
        <div className="nesher-scope-left">
          <div className="nesher-scope-avatar-badge" style={{ background: settings.primaryColor }}>
            {selectedScope === 'global' ? 'NS' : selectedScope.slice(0, 2).toUpperCase()}
            <span className="badge-dot" />
          </div>

          <div className="nesher-scope-titles">
            <h3>
              {selectedScope === 'global'
                ? 'Configuração Global do Ecossistema (Nesher Tech Solutions)'
                : 'Personalização Exclusiva: ' + selectedCompanyName}
              <span className={'nesher-pill-badge ' + (selectedScope === 'global' ? 'global' : 'tenant')}>
                <span className="nesher-pulse-dot" />
                {selectedScope === 'global' ? 'Padrão Geral Ativo' : selectedCompanySLA}
              </span>
            </h3>
            <p>
              {selectedScope === 'global'
                ? 'As diretrizes, cores e tempos definidos aqui são herdados automaticamente por todos os clientes.'
                : 'Esta empresa utiliza as regras exclusivas abaixo, sobrepondo os padrões globais da Nesher.'}
            </p>
          </div>
        </div>

        <div className="nesher-scope-right">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Organização:</span>
            <select
              className="nesher-form-select"
              style={{ height: '38px', fontWeight: 700, minWidth: '220px' }}
              value={selectedScope}
              onChange={(e) => {
                setSelectedScope(e.target.value);
                showToast('Escopo alternado para: ' + (e.target.value === 'global' ? 'Padrão Geral Nesher' : 'Empresa Selecionada'));
              }}
            >
              <option value="global">🌐 Padrão Geral Nesher (Todas)</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  🏢 {c.name} ({c.slaPlan || 'SLA Padrão'})
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="nesher-select"
            style={{ height: '38px', background: '#ffffff', fontWeight: 700, color: '#0f172a' }}
            onClick={() => setIsPreviewModalOpen(true)}
            title="Simular visualização idêntica à do solicitante"
          >
            <i className="ti ti-device-desktop" />
            Visualizar como Funcionário
          </button>

          <button
            type="button"
            className="nesher-primary-button"
            style={{ height: '38px' }}
            onClick={handleSave}
          >
            <i className="ti ti-device-floppy" />
            Salvar Alterações
          </button>
        </div>
      </div>

      {/* Segmented Pill Tabs Navigation */}
      <nav className="nesher-tabs-deck" aria-label="Navegação por categorias de configuração">
        <button
          type="button"
          className={'nesher-tab-pill ' + (activeTab === 'identidade' ? 'is-active' : '')}
          onClick={() => setActiveTab('identidade')}
        >
          <i className="ti ti-building" />
          <span>Empresa &amp; Marca</span>
        </button>

        <button
          type="button"
          className={'nesher-tab-pill ' + (activeTab === 'visual' ? 'is-active' : '')}
          onClick={() => setActiveTab('visual')}
        >
          <i className="ti ti-palette" />
          <span>Visual &amp; Cores</span>
        </button>

        <button
          type="button"
          className={'nesher-tab-pill ' + (activeTab === 'lateral' ? 'is-active' : '')}
          onClick={() => setActiveTab('lateral')}
        >
          <i className="ti ti-layout-sidebar" />
          <span>Menu Lateral</span>
        </button>

        <button
          type="button"
          className={'nesher-tab-pill ' + (activeTab === 'widgets' ? 'is-active' : '')}
          onClick={() => setActiveTab('widgets')}
        >
          <i className="ti ti-layout-grid" />
          <span>Dashboard &amp; Widgets</span>
        </button>

        <button
          type="button"
          className={'nesher-tab-pill ' + (activeTab === 'chamados' ? 'is-active' : '')}
          onClick={() => setActiveTab('chamados')}
        >
          <i className="ti ti-headset" />
          <span>Chamados &amp; Regras</span>
        </button>

        <button
          type="button"
          className={'nesher-tab-pill ' + (activeTab === 'sla' ? 'is-active' : '')}
          onClick={() => setActiveTab('sla')}
        >
          <i className="ti ti-clock-bolt" />
          <span>SLA &amp; Prazos</span>
        </button>

        <button
          type="button"
          className={'nesher-tab-pill ' + (activeTab === 'notificacoes' ? 'is-active' : '')}
          onClick={() => setActiveTab('notificacoes')}
        >
          <i className="ti ti-bell-ringing" />
          <span>Notificações</span>
        </button>

        <button
          type="button"
          className={'nesher-tab-pill ' + (activeTab === 'remoto' ? 'is-active' : '')}
          onClick={() => setActiveTab('remoto')}
        >
          <i className="ti ti-network" />
          <span>Acesso Remoto</span>
        </button>
      </nav>

      {/* 2-Column Master Layout: Form (Left) + Mac-Style Preview Mockup (Right) */}
      <div className="nesher-settings-grid">
        <div className="nesher-settings-form-col">
          {/* TAB 1: IDENTIDADE */}
          {activeTab === 'identidade' && (
            <div className="nesher-settings-card">
              <div className="nesher-settings-card-header">
                <div className="nesher-card-title-row">
                  <div className="nesher-card-icon-badge">
                    <i className="ti ti-id-badge" />
                  </div>
                  <h4>Identidade Institucional &amp; White-Label</h4>
                </div>
                <p>Dados de cabeçalho, contato do suporte NOC e assinatura institucional nos relatórios.</p>
              </div>

              <div className="nesher-form-row">
                <div className="nesher-form-group">
                  <label>
                    Nome Fantasia de Exibição
                    <span className="hint">Aparece no topo e e-mails</span>
                  </label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={settings.companyName}
                    onChange={(e) => updateSettings({ companyName: e.target.value })}
                  />
                </div>
                <div className="nesher-form-group">
                  <label>Razão Social Completa</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={settings.corporateName}
                    onChange={(e) => updateSettings({ corporateName: e.target.value })}
                  />
                </div>
              </div>

              <div className="nesher-form-row">
                <div className="nesher-form-group">
                  <label>CNPJ da Unidade</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={settings.cnpj}
                    onChange={(e) => updateSettings({ cnpj: e.target.value })}
                  />
                </div>
                <div className="nesher-form-group">
                  <label>Telefone / Central WhatsApp do NOC</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={settings.supportPhone}
                    onChange={(e) => updateSettings({ supportPhone: e.target.value })}
                  />
                </div>
              </div>

              <div className="nesher-form-row">
                <div className="nesher-form-group">
                  <label>E-mail Oficial de Notificações</label>
                  <input
                    type="email"
                    className="nesher-form-input"
                    value={settings.supportEmail}
                    onChange={(e) => updateSettings({ supportEmail: e.target.value })}
                  />
                </div>
                <div className="nesher-form-group">
                  <label>Cidade / UF da Sede</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={settings.city + ' - ' + settings.state}
                    onChange={(e) => {
                      const parts = e.target.value.split('-');
                      updateSettings({
                        city: parts[0]?.trim() || settings.city,
                        state: parts[1]?.trim() || settings.state,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="nesher-form-group" style={{ marginBottom: '10px' }}>
                <label>
                  Texto de Rodapé White-Label
                  <span className="hint">Exibido na base dos portais e na emissão de OS</span>
                </label>
                <input
                  type="text"
                  className="nesher-form-input"
                  value={settings.whiteLabelFooter}
                  onChange={(e) => updateSettings({ whiteLabelFooter: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL */}
          {activeTab === 'visual' && (
            <div className="nesher-settings-card">
              <div className="nesher-settings-card-header">
                <div className="nesher-card-title-row">
                  <div className="nesher-card-icon-badge">
                    <i className="ti ti-palette" />
                  </div>
                  <h4>Visual, Cores &amp; Sistema de Design</h4>
                </div>
                <p>Ajuste a paleta de cores primária, tonalidade da barra lateral e estilo dos componentes.</p>
              </div>

              {/* Primary Color Palette */}
              <div className="nesher-form-group" style={{ marginBottom: '22px' }}>
                <label>
                  Cor Primária (Botões de Ação e Destaques)
                  <span className="hint">Define o tom dos botões principais e status</span>
                </label>
                <div className="nesher-color-swatches">
                  {primaryColors.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      className={'nesher-color-swatch-btn ' + (settings.primaryColor === color.hex ? 'is-active' : '')}
                      style={{ background: color.hex }}
                      onClick={() => updateSettings({ primaryColor: color.hex })}
                      title={color.name}
                    >
                      {settings.primaryColor === color.hex && <i className="ti ti-check" />}
                    </button>
                  ))}

                  <div className="nesher-custom-color-pill">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => updateSettings({ primaryColor: e.target.value })}
                      title="Escolher cor personalizada"
                    />
                    <span>{settings.primaryColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Sidebar Background Palette */}
              <div className="nesher-form-group" style={{ marginBottom: '24px' }}>
                <label>
                  Cor de Fundo da Barra Lateral (Menu Operacional)
                  <span className="hint">Tonalidade premium da lateral</span>
                </label>
                <div className="nesher-color-swatches">
                  {sidebarBgs.map((color) => (
                    <button
                      key={color.hex}
                      type="button"
                      className={'nesher-color-swatch-btn ' + (settings.sidebarBg === color.hex ? 'is-active' : '')}
                      style={{ background: color.hex }}
                      onClick={() => updateSettings({ sidebarBg: color.hex })}
                      title={color.name}
                    >
                      {settings.sidebarBg === color.hex && <i className="ti ti-check" />}
                    </button>
                  ))}

                  <div className="nesher-custom-color-pill">
                    <input
                      type="color"
                      value={settings.sidebarBg}
                      onChange={(e) => updateSettings({ sidebarBg: e.target.value })}
                      title="Escolher cor de fundo personalizada"
                    />
                    <span>{settings.sidebarBg.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* Theme Mode Cards */}
              <div className="nesher-form-group" style={{ marginBottom: '22px' }}>
                <label>Tema da Interface do Sistema</label>
                <div className="nesher-theme-cards-grid">
                  <div
                    className={'nesher-theme-choice-card ' + (settings.themeMode === 'light' ? 'is-selected' : '')}
                    onClick={() => updateSettings({ themeMode: 'light' })}
                  >
                    <div className="mini-theme-preview" style={{ background: '#f8fafc' }}>
                      <div style={{ width: '25%', background: '#0b2550' }} />
                      <div style={{ flex: 1, padding: '4px' }}>
                        <div style={{ height: '6px', width: '60%', background: '#0b68d1', borderRadius: '2px', marginBottom: '3px' }} />
                        <div style={{ height: '4px', width: '90%', background: '#cbd5e1', borderRadius: '2px' }} />
                      </div>
                    </div>
                    <strong>Tema Claro</strong>
                    <small>Ideal para helpdesk diurno</small>
                  </div>

                  <div
                    className={'nesher-theme-choice-card ' + (settings.themeMode === 'dark' ? 'is-selected' : '')}
                    onClick={() => updateSettings({ themeMode: 'dark' })}
                  >
                    <div className="mini-theme-preview" style={{ background: '#0f172a' }}>
                      <div style={{ width: '25%', background: '#061021' }} />
                      <div style={{ flex: 1, padding: '4px' }}>
                        <div style={{ height: '6px', width: '60%', background: '#38bdf8', borderRadius: '2px', marginBottom: '3px' }} />
                        <div style={{ height: '4px', width: '90%', background: '#334155', borderRadius: '2px' }} />
                      </div>
                    </div>
                    <strong>Tema Escuro (NOC)</strong>
                    <small>Ideal para salas de monitoramento</small>
                  </div>

                  <div
                    className={'nesher-theme-choice-card ' + (settings.themeMode === 'auto' ? 'is-selected' : '')}
                    onClick={() => updateSettings({ themeMode: 'auto' })}
                  >
                    <div className="mini-theme-preview" style={{ background: 'linear-gradient(90deg, #ffffff 50%, #0f172a 50%)' }}>
                      <div style={{ width: '25%', background: '#0b2550' }} />
                      <div style={{ flex: 1 }} />
                    </div>
                    <strong>Automático</strong>
                    <small>Sincroniza com o sistema</small>
                  </div>
                </div>
              </div>

              {/* Card Curvature */}
              <div className="nesher-form-row">
                <div className="nesher-form-group">
                  <label>Curvatura dos Cantos (Border Radius)</label>
                  <select
                    className="nesher-form-select"
                    value={settings.borderRadius}
                    onChange={(e) => updateSettings({ borderRadius: e.target.value })}
                  >
                    <option value="6px">Sutil &amp; Técnico (6px)</option>
                    <option value="10px">Moderno Balanceado (10px - Padrão)</option>
                    <option value="16px">Suave &amp; Arredondado (16px)</option>
                  </select>
                </div>

                <div className="nesher-form-group">
                  <label>Densidade das Tabelas e Linhas</label>
                  <select
                    className="nesher-form-select"
                    value={settings.uiDensity}
                    onChange={(e) => updateSettings({ uiDensity: e.target.value as any })}
                  >
                    <option value="compact">Compacto (Mais linhas por tela)</option>
                    <option value="normal">Padrão Confortável</option>
                    <option value="spacious">Espaçoso (Visual arejado)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MENU LATERAL */}
          {activeTab === 'lateral' && (
            <div className="nesher-settings-card">
              <div className="nesher-settings-card-header">
                <div className="nesher-card-title-row">
                  <div className="nesher-card-icon-badge">
                    <i className="ti ti-layout-sidebar" />
                  </div>
                  <h4>Comportamento &amp; Módulos da Barra Lateral</h4>
                </div>
                <p>Defina o estado de recolhimento inicial e controle quais menus ficam acessíveis aos usuários.</p>
              </div>

              <div className="nesher-form-group" style={{ marginBottom: '22px' }}>
                <label>Comportamento Padrão Inicial da Barra Lateral</label>
                <select
                  className="nesher-form-select"
                  value={settings.defaultSidebarState}
                  onChange={(e) => updateSettings({ defaultSidebarState: e.target.value as any })}
                >
                  <option value="pinned">Fixado Aberto (280px com nomes de grupos e sanfonas expandidas)</option>
                  <option value="collapsed">Recolhido Compacto (80px - expande suavemente ao passar o mouse)</option>
                </select>
              </div>

              <h5 style={{ margin: '18px 0 12px', fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Módulos Habilitados para a Organização
              </h5>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-message-circle" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Central de Chamados &amp; Ordens de Serviço (OS)</strong>
                    <small>Abertura de tickets, acompanhamento do SLA e emissão de laudo técnico de fechamento.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.visibleModules.chamados}
                    onChange={(e) =>
                      updateSettings({
                        visibleModules: { ...settings.visibleModules, chamados: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-calendar-event" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Agenda Técnica &amp; Visitas de Campo</strong>
                    <small>Despacho de técnicos presenciais, alocação de veículos e geolocalização.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.visibleModules.visitas}
                    onChange={(e) =>
                      updateSettings({
                        visibleModules: { ...settings.visibleModules, visitas: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-devices" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Inventário de Ativos de TI (CMDB)</strong>
                    <small>Controle de computadores, impressoras, switches, servidores e câmeras CFTV.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.visibleModules.equipamentos}
                    onChange={(e) =>
                      updateSettings({
                        visibleModules: { ...settings.visibleModules, equipamentos: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-messages" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Central de Conversas &amp; Chat em Tempo Real</strong>
                    <small>Atendimento estilo Chatwoot com envio de prints e histórico de mensagens.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.visibleModules.comunicacao}
                    onChange={(e) =>
                      updateSettings({
                        visibleModules: { ...settings.visibleModules, comunicacao: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-chart-pie" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Relatórios de Desempenho &amp; Indicadores de SLA</strong>
                    <small>Gráficos de conformidade de tempo, FCR (First Contact Resolution) e CSAT.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.visibleModules.indicadores}
                    onChange={(e) =>
                      updateSettings({
                        visibleModules: { ...settings.visibleModules, indicadores: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: WIDGETS */}
          {activeTab === 'widgets' && (
            <div className="nesher-settings-card">
              <div className="nesher-settings-card-header">
                <div className="nesher-card-title-row">
                  <div className="nesher-card-icon-badge">
                    <i className="ti ti-layout-grid" />
                  </div>
                  <h4>Composição dos Widgets da Visão Geral</h4>
                </div>
                <p>Personalize os painéis exibidos na tela inicial de acordo com as necessidades operacionais.</p>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-cards" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Cartões de Métricas de Topo (KPIs Rápidos)</strong>
                    <small>Contadores de chamados abertos, em atendimento, SLA no prazo e visitas agendadas.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.widgets.topMetrics}
                    onChange={(e) =>
                      updateSettings({
                        widgets: { ...settings.widgets, topMetrics: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-chart-line" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Gráfico Mensal de Volume de Chamados</strong>
                    <small>Evolução diária de atendimentos abertos e resolvidos.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.widgets.ticketChart}
                    onChange={(e) =>
                      updateSettings({
                        widgets: { ...settings.widgets, ticketChart: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-chart-donut-2" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Donut de Conformidade de SLA</strong>
                    <small>Visão percentual dos tickets atendidos rigorosamente dentro do prazo.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.widgets.slaDonut}
                    onChange={(e) =>
                      updateSettings({
                        widgets: { ...settings.widgets, slaDonut: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-map-2" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Painel de Próximas Visitas Técnicas de Campo</strong>
                    <small>Listagem cronológica com status das OS presenciais agendadas.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.widgets.fieldVisits}
                    onChange={(e) =>
                      updateSettings({
                        widgets: { ...settings.widgets, fieldVisits: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-bolt" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Barra Inferior de Ações Rápidas de 1-Clique</strong>
                    <small>Atalhos rápidos para abertura de chamado, agendamento de visita e cadastro de ativo.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.widgets.quickActions}
                    onChange={(e) =>
                      updateSettings({
                        widgets: { ...settings.widgets, quickActions: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: CHAMADOS */}
          {activeTab === 'chamados' && (
            <div className="nesher-settings-card">
              <div className="nesher-settings-card-header">
                <div className="nesher-card-title-row">
                  <div className="nesher-card-icon-badge">
                    <i className="ti ti-headset" />
                  </div>
                  <h4>Regras de Chamados, Protocolos &amp; Horários</h4>
                </div>
                <p>Padronização dos tickets, numeração oficial de protocolo e horários de suporte.</p>
              </div>

              <div className="nesher-form-row">
                <div className="nesher-form-group">
                  <label>
                    Máscara de Numeração de Protocolo
                    <span className="hint">Ex: NS-{'{YYYY}'}-{'{NUM}'}</span>
                  </label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={settings.protocolFormat}
                    onChange={(e) => updateSettings({ protocolFormat: e.target.value })}
                  />
                  <span style={{ fontSize: '11px', color: '#0b68d1', fontWeight: 600, marginTop: '2px' }}>
                    Prévia gerada: NS-2026-0042
                  </span>
                </div>

                <div className="nesher-form-group">
                  <label>Tamanho Máximo por Arquivo Anexo</label>
                  <select
                    className="nesher-form-select"
                    value={settings.maxAttachmentSizeMb}
                    onChange={(e) => updateSettings({ maxAttachmentSizeMb: Number(e.target.value) })}
                  >
                    <option value={10}>Até 10 MB (Leve)</option>
                    <option value={25}>Até 25 MB (Recomendado)</option>
                    <option value={50}>Até 50 MB (Logs e Vídeos)</option>
                  </select>
                </div>
              </div>

              <div className="nesher-form-group" style={{ marginBottom: '18px' }}>
                <label>Horário de Atendimento e Operação do Suporte</label>
                <input
                  type="text"
                  className="nesher-form-input"
                  value={settings.supportHours}
                  onChange={(e) => updateSettings({ supportHours: e.target.value })}
                />
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-paperclip" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Permitir Envio de Prints e Anexos pelos Clientes</strong>
                    <small>Habilita upload de capturas de tela, relatórios em PDF e logs de erros no formulário de abertura.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.allowAttachments}
                    onChange={(e) => updateSettings({ allowAttachments: e.target.checked })}
                  />
                  <span className="nesher-slider" />
                </label>
              </div>
            </div>
          )}

          {/* TAB 6: SLA */}
          {activeTab === 'sla' && (
            <div className="nesher-settings-card">
              <div className="nesher-settings-card-header">
                <div className="nesher-card-title-row">
                  <div className="nesher-card-icon-badge">
                    <i className="ti ti-clock-bolt" />
                  </div>
                  <h4>Matriz de Prazos de SLA &amp; Criticidades</h4>
                </div>
                <p>Metas contratuais rigorosas para primeira resposta e resolução definitiva de ocorrências.</p>
              </div>

              <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', padding: '10px 14px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>
                  <span>Nível de Criticidade</span>
                  <span>1ª Resposta</span>
                  <span>Resolução Definitiva</span>
                </div>

                <div className="nesher-sla-urgency-row">
                  <span className="nesher-urgency-tag critica">
                    <span className="nesher-pulse-dot" style={{ background: '#dc2626' }} />
                    Crítica (Parada)
                  </span>
                  <input
                    type="text"
                    className="nesher-form-input"
                    style={{ height: '34px' }}
                    value={settings.slaPrazos.critica.resposta}
                    onChange={(e) =>
                      updateSettings({
                        slaPrazos: {
                          ...settings.slaPrazos,
                          critica: { ...settings.slaPrazos.critica, resposta: e.target.value },
                        },
                      })
                    }
                  />
                  <input
                    type="text"
                    className="nesher-form-input"
                    style={{ height: '34px' }}
                    value={settings.slaPrazos.critica.solucao}
                    onChange={(e) =>
                      updateSettings({
                        slaPrazos: {
                          ...settings.slaPrazos,
                          critica: { ...settings.slaPrazos.critica, solucao: e.target.value },
                        },
                      })
                    }
                  />
                </div>

                <div className="nesher-sla-urgency-row">
                  <span className="nesher-urgency-tag alta">
                    <span className="nesher-pulse-dot" style={{ background: '#ea580c' }} />
                    Alta (Impacto)
                  </span>
                  <input
                    type="text"
                    className="nesher-form-input"
                    style={{ height: '34px' }}
                    value={settings.slaPrazos.alta.resposta}
                    onChange={(e) =>
                      updateSettings({
                        slaPrazos: {
                          ...settings.slaPrazos,
                          alta: { ...settings.slaPrazos.alta, resposta: e.target.value },
                        },
                      })
                    }
                  />
                  <input
                    type="text"
                    className="nesher-form-input"
                    style={{ height: '34px' }}
                    value={settings.slaPrazos.alta.solucao}
                    onChange={(e) =>
                      updateSettings({
                        slaPrazos: {
                          ...settings.slaPrazos,
                          alta: { ...settings.slaPrazos.alta, solucao: e.target.value },
                        },
                      })
                    }
                  />
                </div>

                <div className="nesher-sla-urgency-row">
                  <span className="nesher-urgency-tag media">
                    <span className="nesher-pulse-dot" style={{ background: '#d97706' }} />
                    Média (Dúvidas)
                  </span>
                  <input
                    type="text"
                    className="nesher-form-input"
                    style={{ height: '34px' }}
                    value={settings.slaPrazos.media.resposta}
                    onChange={(e) =>
                      updateSettings({
                        slaPrazos: {
                          ...settings.slaPrazos,
                          media: { ...settings.slaPrazos.media, resposta: e.target.value },
                        },
                      })
                    }
                  />
                  <input
                    type="text"
                    className="nesher-form-input"
                    style={{ height: '34px' }}
                    value={settings.slaPrazos.media.solucao}
                    onChange={(e) =>
                      updateSettings({
                        slaPrazos: {
                          ...settings.slaPrazos,
                          media: { ...settings.slaPrazos.media, solucao: e.target.value },
                        },
                      })
                    }
                  />
                </div>

                <div className="nesher-sla-urgency-row">
                  <span className="nesher-urgency-tag baixa">
                    <span className="nesher-pulse-dot" style={{ background: '#16a34a' }} />
                    Baixa (Rotina)
                  </span>
                  <input
                    type="text"
                    className="nesher-form-input"
                    style={{ height: '34px' }}
                    value={settings.slaPrazos.baixa.resposta}
                    onChange={(e) =>
                      updateSettings({
                        slaPrazos: {
                          ...settings.slaPrazos,
                          baixa: { ...settings.slaPrazos.baixa, resposta: e.target.value },
                        },
                      })
                    }
                  />
                  <input
                    type="text"
                    className="nesher-form-input"
                    style={{ height: '34px' }}
                    value={settings.slaPrazos.baixa.solucao}
                    onChange={(e) =>
                      updateSettings({
                        slaPrazos: {
                          ...settings.slaPrazos,
                          baixa: { ...settings.slaPrazos.baixa, solucao: e.target.value },
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="nesher-form-group">
                <label>Método de Contagem do Tempo de SLA</label>
                <select
                  className="nesher-form-select"
                  value={settings.slaSchedule}
                  onChange={(e) => updateSettings({ slaSchedule: e.target.value as any })}
                >
                  <option value="commercial">Apenas Horário Comercial (Congela contagem em noites e finais de semana)</option>
                  <option value="24x7">Contagem Ininterrupta 24 Horas x 7 Dias (Contratos Críticos / Missão Crítica)</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 7: NOTIFICAÇÕES */}
          {activeTab === 'notificacoes' && (
            <div className="nesher-settings-card">
              <div className="nesher-settings-card-header">
                <div className="nesher-card-title-row">
                  <div className="nesher-card-icon-badge">
                    <i className="ti ti-bell-ringing" />
                  </div>
                  <h4>Canais de Alertas &amp; Gatilhos de Notificação</h4>
                </div>
                <p>Notifique a equipe do NOC e os solicitantes de forma ágil e multicanal.</p>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-bell" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Notificações no Sino da Aplicação (In-App)</strong>
                    <small>Alertas visuais instantâneos na barra superior quando houver novo chamado ou atualização.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.systemBell}
                    onChange={(e) =>
                      updateSettings({
                        notifications: { ...settings.notifications, systemBell: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-mail" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Disparo Automático de E-mails Transacionais</strong>
                    <small>Envia confirmação com número de protocolo na abertura e resumo no encerramento da OS.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.emailAlerts}
                    onChange={(e) =>
                      updateSettings({
                        notifications: { ...settings.notifications, emailAlerts: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-brand-whatsapp" />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Notificações via WhatsApp / Webhook Nesher</strong>
                    <small>Avisa o solicitante sobre a saída do técnico de campo e link de aprovação digital da OS.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.whatsappAlerts}
                    onChange={(e) =>
                      updateSettings({
                        notifications: { ...settings.notifications, whatsappAlerts: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div className="nesher-toggle-card">
                <div className="nesher-toggle-card-left">
                  <div className="nesher-toggle-card-icon">
                    <i className="ti ti-alert-triangle" style={{ color: '#ea580c' }} />
                  </div>
                  <div className="nesher-toggle-card-text">
                    <strong>Alerta Preventivo de SLA (80% do Prazo Contratual)</strong>
                    <small>Dispara aviso de prioridade aos supervisores do NOC antes que o chamado expire.</small>
                  </div>
                </div>
                <label className="nesher-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications.slaWarning}
                    onChange={(e) =>
                      updateSettings({
                        notifications: { ...settings.notifications, slaWarning: e.target.checked },
                      })
                    }
                  />
                  <span className="nesher-slider" />
                </label>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="nesher-select"
                  onClick={() => showToast('Disparo de notificação de teste simulado com êxito no sino e e-mail!')}
                >
                  <i className="ti ti-send" />
                  Enviar Notificação de Teste
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: REMOTO */}
          {activeTab === 'remoto' && (
            <div className="nesher-settings-card">
              <div className="nesher-settings-card-header">
                <div className="nesher-card-title-row">
                  <div className="nesher-card-icon-badge">
                    <i className="ti ti-network" />
                  </div>
                  <h4>Suporte &amp; Assistência Remota aos Desktops</h4>
                </div>
                <p>Ferramenta homologada para diagnóstico e controle à distância de computadores e servidores.</p>
              </div>

              <div className="nesher-form-group" style={{ marginBottom: '18px' }}>
                <label>Ferramenta Oficial Padrão do Contrato</label>
                <select
                  className="nesher-form-select"
                  value={settings.remoteTool}
                  onChange={(e) => updateSettings({ remoteTool: e.target.value as any })}
                >
                  <option value="rustdesk">RustDesk (Servidor Próprio Nesher Tech - Criptografia Ponta a Ponta)</option>
                  <option value="anydesk">AnyDesk Professional</option>
                  <option value="teamviewer">TeamViewer Corporate</option>
                  <option value="webrtc">WebRTC Assist (Direto no Navegador)</option>
                </select>
              </div>

              <div className="nesher-form-group" style={{ marginBottom: '18px' }}>
                <label>Instruções Padrão Enviadas ao Usuário Solicitante</label>
                <textarea
                  className="nesher-form-input"
                  style={{ height: '84px', padding: '10px', resize: 'vertical' }}
                  value={settings.remoteInstructions}
                  onChange={(e) => updateSettings({ remoteInstructions: e.target.value })}
                />
              </div>

              <div
                style={{
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className="ti ti-download" style={{ fontSize: '22px', color: '#0b68d1' }} />
                  <div>
                    <strong style={{ fontSize: '12px', color: '#1e3a8a', display: 'block' }}>
                      Cliente Remoto Nesher Tech (QuickSupport)
                    </strong>
                    <small style={{ color: '#3b82f6' }}>Versão pré-configurada com IP do servidor privado do NOC.</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="nesher-primary-button"
                  style={{ height: '34px', padding: '0 12px', fontSize: '11px' }}
                  onClick={() => showToast('Download do cliente executável Nesher iniciado.')}
                >
                  Baixar Instalador
                </button>
              </div>
            </div>
          )}

          {/* Card Footer Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
            <button
              type="button"
              className="nesher-select"
              style={{ color: '#dc2626', fontWeight: 700 }}
              onClick={handleResetDefaults}
            >
              <i className="ti ti-rotate-clockwise" />
              Restaurar Padrões Globais
            </button>

            <button type="button" className="nesher-primary-button" onClick={handleSave}>
              <i className="ti ti-device-floppy" />
              Salvar e Aplicar para a Empresa
            </button>
          </div>
        </div>

        {/* Right Sticky Mac-Style Live Preview Mockup */}
        <div className="nesher-settings-preview-col">
          <div className="nesher-mac-mockup">
            <div className="nesher-mac-header">
              <div className="nesher-mac-dots">
                <span className="nesher-mac-dot red" />
                <span className="nesher-mac-dot yellow" />
                <span className="nesher-mac-dot green" />
              </div>

              <div className="nesher-mac-url-bar">
                <span>app.neshertech.com.br/dashboard</span>
              </div>

              <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8' }}>
                PRÉVIA AO VIVO
              </span>
            </div>

            <div className="nesher-mac-viewport">
              <div
                className="nesher-mini-shell"
                style={{
                  borderRadius: settings.borderRadius,
                  border: '1px solid #cbd5e1',
                }}
              >
                {/* Mini Sidebar */}
                <div className="nesher-mini-sidebar" style={{ background: settings.sidebarBg }}>
                  <div className="nesher-mini-brand">
                    <span
                      style={{
                        width: '22px',
                        height: '22px',
                        background: settings.primaryColor,
                        borderRadius: '5px',
                        display: 'grid',
                        placeItems: 'center',
                        color: '#fff',
                        fontSize: '11px',
                        fontWeight: 800,
                      }}
                    >
                      N
                    </span>
                    <span style={{ fontSize: '9px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 800 }}>
                      {settings.companyName.split(' ')[0]}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '6px' }}>
                    <div className="nesher-mini-link is-active" style={{ background: settings.primaryColor }}>
                      <i className="ti ti-layout-dashboard" />
                      <span>Dashboard</span>
                    </div>

                    {settings.visibleModules.chamados && (
                      <div className="nesher-mini-link">
                        <i className="ti ti-message-circle" />
                        <span>Chamados</span>
                      </div>
                    )}

                    {settings.visibleModules.visitas && (
                      <div className="nesher-mini-link">
                        <i className="ti ti-calendar-event" />
                        <span>Visitas</span>
                      </div>
                    )}

                    {settings.visibleModules.equipamentos && (
                      <div className="nesher-mini-link">
                        <i className="ti ti-devices" />
                        <span>Ativos CMDB</span>
                      </div>
                    )}

                    {settings.visibleModules.comunicacao && (
                      <div className="nesher-mini-link">
                        <i className="ti ti-messages" />
                        <span>Conversas</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mini Content Area */}
                <div className="nesher-mini-content">
                  <div className="nesher-mini-topbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#0f172a' }}>
                        {settings.companyName}
                      </span>
                    </div>

                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: settings.primaryColor,
                        color: '#fff',
                        fontSize: '8px',
                        fontWeight: 800,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      AD
                    </span>
                  </div>

                  <div className="nesher-mini-metric-grid">
                    <div className="nesher-mini-metric" style={{ borderRadius: settings.borderRadius }}>
                      <span>Chamados Abertos</span>
                      <strong style={{ color: settings.primaryColor }}>12</strong>
                    </div>
                    <div className="nesher-mini-metric" style={{ borderRadius: settings.borderRadius }}>
                      <span>Conformidade SLA</span>
                      <strong style={{ color: '#16a34a' }}>98.6%</strong>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: settings.borderRadius,
                      padding: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '4px',
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '8px', color: '#64748b' }}>Próxima Visita Técnica</span>
                      <strong style={{ display: 'block', fontSize: '10px', color: '#0f172a' }}>
                        Terça às 14:00 (NOC)
                      </strong>
                    </div>
                    <span
                      style={{
                        background: settings.primaryColor,
                        color: '#fff',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '7px',
                        fontWeight: 700,
                      }}
                    >
                      OS-0084
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 'auto',
                      padding: '6px',
                      background: '#f1f5f9',
                      borderRadius: '4px',
                      fontSize: '7px',
                      color: '#64748b',
                      textAlign: 'center',
                      lineHeight: 1.3,
                    }}
                  >
                    {settings.whiteLabelFooter}
                  </div>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <small style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.4, display: 'block' }}>
                  Esta miniatura reflete exatamente a identidade visual, cores e widgets configurados.
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Save Dock (Appears when changes are made) */}
      {hasChanges && (
        <div className="nesher-floating-save-dock">
          <div className="nesher-dock-status">
            <span className="nesher-dock-dot" />
            <span>Há alterações não salvas neste escopo</span>
          </div>

          <div className="nesher-dock-actions">
            <button type="button" className="nesher-dock-discard-btn" onClick={handleDiscard}>
              Descartar
            </button>
            <button type="button" className="nesher-dock-save-btn" onClick={handleSave}>
              <i className="ti ti-check" /> Salvar e Aplicar (Ctrl+S)
            </button>
          </div>
        </div>
      )}

      {/* High-Fidelity Simulation Modal ("Visualizar como Funcionário") */}
      {isPreviewModalOpen && (
        <div className="nesher-sim-modal-backdrop" onClick={() => setIsPreviewModalOpen(false)}>
          <div className="nesher-sim-modal-frame" onClick={(e) => e.stopPropagation()}>
            <div className="nesher-sim-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '8px',
                    background: settings.primaryColor,
                    display: 'grid',
                    placeItems: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '16px',
                  }}
                >
                  <i className="ti ti-user" />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
                    Simulação: Visão do Colaborador da {settings.companyName}
                  </h4>
                  <small style={{ color: '#94a3b8' }}>
                    Perfil: Solicitante (Sem permissões de gestão do NOC da Nesher Tech)
                  </small>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '20px', cursor: 'pointer' }}
                title="Fechar simulação"
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <div className="nesher-sim-body">
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: settings.borderRadius,
                  padding: '24px 28px',
                  boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a', fontWeight: 700 }}>
                      Portal de Atendimento ao Usuário
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                      {settings.companyName} • Suporte Corporativo Nesher Tech Solutions
                    </p>
                  </div>

                  <button
                    type="button"
                    className="nesher-primary-button"
                    style={{ background: settings.primaryColor }}
                    onClick={() => {
                      setIsPreviewModalOpen(false);
                      window.location.href = '/dashboard/chamados';
                    }}
                  >
                    <i className="ti ti-plus" />
                    Abrir Novo Chamado
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Meus Chamados Ativos
                    </span>
                    <strong style={{ display: 'block', fontSize: '24px', color: '#0f172a', marginTop: '4px' }}>
                      2
                    </strong>
                    <small style={{ color: '#16a34a', fontWeight: 600 }}>1 em atendimento técnico</small>
                  </div>

                  <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Próxima Visita Presencial
                    </span>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a', marginTop: '8px' }}>
                      Terça às 14:00 (NOC)
                    </strong>
                    <small style={{ color: '#0b68d1', fontWeight: 600 }}>Técnico alocado: Anderson M.</small>
                  </div>

                  <div style={{ padding: '16px', border: '1px solid #e2e8f0', borderRadius: '10px', background: '#f8fafc' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                      Central de Emergência
                    </span>
                    <strong style={{ display: 'block', fontSize: '15px', color: settings.primaryColor, marginTop: '8px' }}>
                      {settings.supportPhone}
                    </strong>
                    <small style={{ color: '#64748b' }}>{settings.supportHours}</small>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: '13px', color: '#0f172a', fontWeight: 700 }}>
                    Como funciona o atendimento remoto rápido:
                  </h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.55 }}>
                    {settings.remoteInstructions}
                  </p>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <button
                  type="button"
                  className="nesher-select"
                  style={{ display: 'inline-flex', fontWeight: 700 }}
                  onClick={() => setIsPreviewModalOpen(false)}
                >
                  <i className="ti ti-arrow-left" /> Fechar Modo Simulação
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
