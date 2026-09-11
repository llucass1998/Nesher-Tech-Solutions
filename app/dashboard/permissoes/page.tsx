'use client';

import { useState } from 'react';

interface RoleProfile {
  id: string;
  name: string;
  badge: string;
  description: string;
  userCount: number;
  permissions: {
    canManageCompanies: boolean;
    canViewAllTickets: boolean;
    canResolveTickets: boolean;
    canScheduleVisits: boolean;
    canEditCMDB: boolean;
    canAccessSettings: boolean;
  };
}

const defaultProfiles: RoleProfile[] = [
  {
    id: 'admin-nesher',
    name: 'Administrador Nesher Tech',
    badge: 'Acesso Total',
    description: 'Gestores técnicos do NOC e diretoria da Nesher com controle irrestrito do ecossistema.',
    userCount: 3,
    permissions: {
      canManageCompanies: true,
      canViewAllTickets: true,
      canResolveTickets: true,
      canScheduleVisits: true,
      canEditCMDB: true,
      canAccessSettings: true,
    },
  },
  {
    id: 'tecnico-n2',
    name: 'Analista / Técnico de Campo',
    badge: 'Operação',
    description: 'Técnicos responsáveis pelo atendimento, intervenções físicas, fechamento de OS e inventário.',
    userCount: 8,
    permissions: {
      canManageCompanies: false,
      canViewAllTickets: true,
      canResolveTickets: true,
      canScheduleVisits: true,
      canEditCMDB: true,
      canAccessSettings: false,
    },
  },
  {
    id: 'gestor-cliente',
    name: 'Gestor da Empresa Cliente',
    badge: 'Multi-Tenant',
    description: 'Líder do cliente com visibilidade sobre todos os chamados e ativos da sua própria empresa.',
    userCount: 14,
    permissions: {
      canManageCompanies: false,
      canViewAllTickets: false,
      canResolveTickets: false,
      canScheduleVisits: false,
      canEditCMDB: false,
      canAccessSettings: false,
    },
  },
  {
    id: 'solicitante-padrao',
    name: 'Funcionário / Solicitante Padrão',
    badge: 'Portal Básico',
    description: 'Abertura rápida de chamados, visualização de suas próprias solicitações e aprovação de OS.',
    userCount: 120,
    permissions: {
      canManageCompanies: false,
      canViewAllTickets: false,
      canResolveTickets: false,
      canScheduleVisits: false,
      canEditCMDB: false,
      canAccessSettings: false,
    },
  },
];

export default function PermissoesPage() {
  const [profiles] = useState<RoleProfile[]>(defaultProfiles);

  return (
    <div className="nesher-dashboard">
      <div className="nesher-welcome-row">
        <div>
          <p className="nesher-eyebrow">GOVERNANÇA &amp; SEGURANÇA MULTI-EMPRESA</p>
          <h1>Controle de Acesso &amp; Permissões (RBAC)</h1>
          <p className="nesher-welcome-copy">
            Isolamento de privilégios entre analistas do NOC da Nesher e colaboradores das empresas parceiras.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {profiles.map((p) => (
          <div key={p.id} className="nesher-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <strong style={{ fontSize: '15px', color: '#0f172a' }}>{p.name}</strong>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {p.userCount} usuários ativos neste perfil
                </span>
              </div>
              <span
                className="nesher-sla-badge"
                style={{
                  background: p.id === 'admin-nesher' ? '#eff6ff' : '#f8fafc',
                  color: p.id === 'admin-nesher' ? '#0b68d1' : '#475569',
                }}
              >
                {p.badge}
              </span>
            </div>

            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.45, margin: '10px 0 16px' }}>{p.description}</p>

            <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Cadastrar e aprovar empresas parceiras</span>
                <i className={`ti ti-${p.permissions.canManageCompanies ? 'check text-green-600' : 'x text-slate-300'}`} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Ver fila global de todos os chamados</span>
                <i className={`ti ti-${p.permissions.canViewAllTickets ? 'check text-green-600' : 'x text-slate-300'}`} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Resolver e emitir laudo de OS</span>
                <i className={`ti ti-${p.permissions.canResolveTickets ? 'check text-green-600' : 'x text-slate-300'}`} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Agendar visitas presenciais de campo</span>
                <i className={`ti ti-${p.permissions.canScheduleVisits ? 'check text-green-600' : 'x text-slate-300'}`} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Cadastrar e editar equipamentos (CMDB)</span>
                <i className={`ti ti-${p.permissions.canEditCMDB ? 'check text-green-600' : 'x text-slate-300'}`} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Acessar configurações globais do sistema</span>
                <i className={`ti ti-${p.permissions.canAccessSettings ? 'check text-green-600' : 'x text-slate-300'}`} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
