'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export type CompanyStatus = 'Aprovada' | 'Pendente' | 'Bloqueada';
export type SLAPlan = 'Básico (8x5)' | 'Prata (12x5)' | 'Ouro (24x7)';

export interface CompanyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  accessLevel: 'Gestor da Empresa' | 'Solicitante';
  active: boolean;
}

export interface CompanyDevice {
  id: string;
  tag: string;
  type: 'Desktop' | 'Notebook' | 'Impressora' | 'Servidor' | 'Switch / Rede';
  model: string;
  serial: string;
  user: string;
  status: 'Operacional' | 'Em Manutenção' | 'Reserva';
}

export interface CompanyTicketSummary {
  id: string;
  code: string;
  subject: string;
  priority: 'Urgente' | 'Alta' | 'Média' | 'Baixa';
  status: string;
  createdAt: string;
}

export interface Company {
  id: string;
  corporateName: string; // Razão Social
  tradeName: string;     // Nome Fantasia
  cnpj: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  address: string;
  slaPlan: SLAPlan;
  status: CompanyStatus;
  createdAt: string;
  contractStart: string;
  activeTicketsCount: number;
  devicesCount: number;
  managerName: string;
  managerEmail: string;
  members: CompanyMember[];
  devices: CompanyDevice[];
  tickets: CompanyTicketSummary[];
}

const initialCompanies: Company[] = [];

export default function EmpresasPage() {
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todas' | CompanyStatus>('Todas');
  const [slaFilter, setSlaFilter] = useState<'Todos' | SLAPlan>('Todos');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [drawerTab, setDrawerTab] = useState<'info' | 'members' | 'devices' | 'tickets'>('info');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);

  // Load from localStorage on mount (and purge any old fake demo data)
  useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage.getItem('nesher_companies');
        if (raw) {
          const parsed = JSON.parse(raw);
          const real = Array.isArray(parsed) ? parsed.filter((c: any) => !['comp-1', 'comp-2', 'comp-3', 'comp-4', 'comp-5', 'comp-6'].includes(c.id)) : [];
          setCompanies(real);
        } else {
          setCompanies([]);
        }
      } catch {
        setCompanies([]);
      }
    }
  });

  const persistCompanies = (newComps: Company[]) => {
    setCompanies(newComps);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('nesher_companies', JSON.stringify(newComps));
      } catch {}
    }
  };

  // New Company form states
  const [newCorpName, setNewCorpName] = useState('');
  const [newTradeName, setNewTradeName] = useState('');
  const [newCnpj, setNewCnpj] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('SP');
  const [newAddress, setNewAddress] = useState('');
  const [newSla, setNewSla] = useState<SLAPlan>('Prata (12x5)');
  const [newManager, setNewManager] = useState('');

  // New Member form states
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberDept, setNewMemberDept] = useState('');
  const [newMemberLevel, setNewMemberLevel] = useState<'Gestor da Empresa' | 'Solicitante'>('Solicitante');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      const matchSearch =
        c.tradeName.toLowerCase().includes(search.toLowerCase()) ||
        c.corporateName.toLowerCase().includes(search.toLowerCase()) ||
        c.cnpj.includes(search) ||
        c.city.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'Todas' ? true : c.status === statusFilter;
      const matchSla = slaFilter === 'Todos' ? true : c.slaPlan === slaFilter;

      return matchSearch && matchStatus && matchSla;
    });
  }, [companies, search, statusFilter, slaFilter]);

  // Status stats
  const stats = useMemo(() => {
    const total = companies.length;
    const approved = companies.filter((c) => c.status === 'Aprovada').length;
    const pending = companies.filter((c) => c.status === 'Pendente').length;
    const blocked = companies.filter((c) => c.status === 'Bloqueada').length;
    const totalDevices = companies.reduce((acc, c) => acc + c.devicesCount, 0);
    const totalTickets = companies.reduce((acc, c) => acc + c.activeTicketsCount, 0);
    return { total, approved, pending, blocked, totalDevices, totalTickets };
  }, [companies]);

  // Actions
  const handleApproveCompany = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = companies.map((c) => (c.id === id ? { ...c, status: 'Aprovada' as CompanyStatus, contractStart: 'Hoje' } : c));
    persistCompanies(updated);
    if (selectedCompany && selectedCompany.id === id) {
      setSelectedCompany((prev) => (prev ? { ...prev, status: 'Aprovada', contractStart: 'Hoje' } : null));
    }
    showToast('Empresa aprovada com sucesso! Acesso liberado ao portal.');
  };

  const handleToggleBlock = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = companies.map((c) => {
      if (c.id === id) {
        const nextStatus: CompanyStatus = c.status === 'Bloqueada' ? 'Aprovada' : 'Bloqueada';
        return { ...c, status: nextStatus };
      }
      return c;
    });
    persistCompanies(updated);
    if (selectedCompany && selectedCompany.id === id) {
      setSelectedCompany((prev) =>
        prev ? { ...prev, status: prev.status === 'Bloqueada' ? 'Aprovada' : 'Bloqueada' } : null
      );
    }
    showToast('Status da organização atualizado.');
  };

  const handleCreateCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTradeName || !newCnpj || !newEmail) {
      alert('Preencha os campos obrigatórios (Nome Fantasia, CNPJ e E-mail).');
      return;
    }

    const newComp: Company = {
      id: `comp-${Date.now()}`,
      corporateName: newCorpName || newTradeName,
      tradeName: newTradeName,
      cnpj: newCnpj,
      phone: newPhone || '(11) 3000-0000',
      email: newEmail,
      city: newCity || 'São Paulo',
      state: newState,
      address: newAddress || 'Endereço Comercial',
      slaPlan: newSla,
      status: 'Aprovada',
      createdAt: 'Hoje',
      contractStart: 'Hoje',
      activeTicketsCount: 0,
      devicesCount: 0,
      managerName: newManager || 'Gestor Responsável',
      managerEmail: newEmail,
      members: [
        {
          id: `m-${Date.now()}`,
          name: newManager || 'Gestor Principal',
          email: newEmail,
          role: 'Gestor Administrativo',
          department: 'Administração',
          accessLevel: 'Gestor da Empresa',
          active: true
        }
      ],
      devices: [],
      tickets: []
    };

    persistCompanies([newComp, ...companies]);
    setIsCreateModalOpen(false);
    showToast(`Empresa ${newTradeName} cadastrada e ativada!`);

    // Reset
    setNewCorpName('');
    setNewTradeName('');
    setNewCnpj('');
    setNewPhone('');
    setNewEmail('');
    setNewCity('');
    setNewAddress('');
    setNewManager('');
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !newMemberName || !newMemberEmail) {
      alert('Preencha o Nome e o E-mail do colaborador.');
      return;
    }

    const newMember: CompanyMember = {
      id: `mem-${Date.now()}`,
      name: newMemberName,
      email: newMemberEmail,
      role: newMemberRole || 'Colaborador',
      department: newMemberDept || 'Geral',
      accessLevel: newMemberLevel,
      active: true
    };

    const updated = {
      ...selectedCompany,
      members: [...selectedCompany.members, newMember]
    };

    setSelectedCompany(updated);
    persistCompanies(companies.map((c) => (c.id === updated.id ? updated : c)));
    setIsAddMemberModalOpen(false);
    showToast(`Colaborador ${newMemberName} adicionado à ${selectedCompany.tradeName}!`);

    setNewMemberName('');
    setNewMemberEmail('');
    setNewMemberRole('');
    setNewMemberDept('');
  };

  return (
    <div className="nesher-dashboard">
      {/* Toast */}
      {toastMessage && (
        <div className="nesher-toast">
          <i className="ti ti-circle-check" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="nesher-page-header">
        <div className="nesher-page-header-info">
          <p className="nesher-eyebrow">MULTI-TENANT & GESTÃO CORPORATIVA</p>
          <h1>Empresas Clientes & Organizações</h1>
          <p>
            Gerencie as empresas conveniadas, aprove solicitações de novos cadastros de clientes,
            controle acordos de nível de serviço (SLA), inventário alocado e colaboradores com acesso ao suporte.
          </p>
        </div>
        <div className="nesher-page-header-actions">
          <button
            type="button"
            className="nesher-primary-button"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <i className="ti ti-plus" />
            <span>Cadastrar Nova Empresa</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="nesher-metric-grid" style={{ marginBottom: '24px' }}>
        <div className="nesher-metric-card">
          <span className="nesher-metric-icon blue">
            <i className="ti ti-building-community" />
          </span>
          <div className="nesher-metric-main">
            <span>EMPRESAS ATIVAS</span>
            <strong>{stats.approved}</strong>
            <small><b>{stats.total}</b> organizações cadastradas</small>
          </div>
        </div>

        <div className="nesher-metric-card" style={{ borderLeft: stats.pending > 0 ? '3px solid #f59e0b' : undefined }}>
          <span className="nesher-metric-icon orange">
            <i className="ti ti-user-exclamation" />
          </span>
          <div className="nesher-metric-main">
            <span>PENDENTES DE APROVAÇÃO</span>
            <strong style={{ color: stats.pending > 0 ? '#d97706' : undefined }}>{stats.pending}</strong>
            <small>
              {stats.pending > 0 ? (
                <b style={{ color: '#d97706' }}>Aguardando validação da equipe</b>
              ) : (
                'Nenhum cadastro pendente'
              )}
            </small>
          </div>
        </div>

        <div className="nesher-metric-card">
          <span className="nesher-metric-icon purple">
            <i className="ti ti-devices" />
          </span>
          <div className="nesher-metric-main">
            <span>DISPOSITIVOS MONITORADOS</span>
            <strong>{stats.totalDevices}</strong>
            <small>Desktops, notebooks, servidores</small>
          </div>
        </div>

        <div className="nesher-metric-card">
          <span className="nesher-metric-icon green">
            <i className="ti ti-ticket" />
          </span>
          <div className="nesher-metric-main">
            <span>CHAMADOS ATIVOS NO NOC</span>
            <strong>{stats.totalTickets}</strong>
            <small>Em atendimento no momento</small>
          </div>
        </div>
      </div>

      {/* Alert for Pending Companies */}
      {stats.pending > 0 && (
        <div style={{
          background: '#fef3c7',
          border: '1px solid #fde68a',
          borderRadius: '10px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <i className="ti ti-alert-triangle" style={{ color: '#d97706', fontSize: '22px' }} />
            <div>
              <strong style={{ color: '#92400e', fontSize: '13px', display: 'block' }}>
                Existem {stats.pending} empresas aguardando aprovação cadastral!
              </strong>
              <span style={{ color: '#b45309', fontSize: '11px' }}>
                Clientes que realizaram auto-cadastro pela página inicial precisam ser validados para liberar chamados e SLA.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusFilter('Pendente')}
            style={{
              background: '#d97706',
              color: '#ffffff',
              border: 0,
              padding: '7px 14px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            Filtrar Pendentes
          </button>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="nesher-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
            <i
              className="ti ti-search"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '16px' }}
            />
            <input
              type="text"
              placeholder="Buscar por Razão Social, Fantasia, CNPJ ou Cidade..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 12px 9px 36px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                fontSize: '12px',
                outline: 'none',
                background: '#f8fafc'
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 0, background: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>Status:</span>
            {(['Todas', 'Aprovada', 'Pendente', 'Bloqueada'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: statusFilter === status ? '#2563eb' : '#e2e8f0',
                  background: statusFilter === status ? '#eff6ff' : '#ffffff',
                  color: statusFilter === status ? '#1d4ed8' : '#64748b'
                }}
              >
                {status}
                {status === 'Pendente' && stats.pending > 0 && (
                  <span style={{ marginLeft: '6px', background: '#f59e0b', color: '#fff', borderRadius: '50%', padding: '1px 5px', fontSize: '9px' }}>
                    {stats.pending}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* SLA Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Plano SLA:</span>
            <select
              value={slaFilter}
              onChange={(e) => setSlaFilter(e.target.value as any)}
              style={{
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                fontSize: '11px',
                color: '#334155',
                background: '#ffffff',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              <option value="Todos">Todos os Planos</option>
              <option value="Ouro (24x7)">Ouro (24x7)</option>
              <option value="Prata (12x5)">Prata (12x5)</option>
              <option value="Básico (8x5)">Básico (8x5)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Companies List Table */}
      <div className="nesher-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Organizações Conveniadas ({filteredCompanies.length})
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748b' }}>
              Clique em uma linha para ver o perfil completo, equipe de colaboradores e inventário de equipamentos.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Empresa / Razão Social</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>CNPJ & Contato</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Cidade / UF</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Plano SLA</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Ativos</th>
                <th style={{ padding: '12px 14px', fontWeight: 700, textAlign: 'center' }}>Chamados</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '56px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1f5f9', color: '#64748b', display: 'grid', placeItems: 'center', fontSize: 28, margin: '0 auto 14px' }}>
                      <i className="ti ti-building-community" />
                    </div>
                    <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>
                      {companies.length === 0 ? 'Nenhuma empresa cadastrada (Base Zerada)' : 'Nenhuma empresa encontrada com os filtros atuais'}
                    </strong>
                    <span style={{ fontSize: '12px', display: 'block', marginTop: 4, maxWidth: 420, margin: '6px auto 0', color: '#64748b' }}>
                      {companies.length === 0
                        ? 'Sua plataforma está limpa e pronta para receber os clientes reais da sua operação.'
                        : 'Tente alterar os termos de busca ou remover os filtros de status e SLA.'}
                    </span>
                    {companies.length === 0 && (
                      <button
                        type="button"
                        className="nesher-primary-button"
                        style={{ margin: '18px auto 0' }}
                        onClick={() => setIsCreateModalOpen(true)}
                      >
                        <i className="ti ti-plus" />
                        <span>Cadastrar Primeira Empresa</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((c) => {
                  const isGold = c.slaPlan.includes('Ouro');
                  const isSilver = c.slaPlan.includes('Prata');
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCompany(c)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Empresa */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: isGold ? '#fef3c7' : isSilver ? '#e0f2fe' : '#f1f5f9',
                              color: isGold ? '#b45309' : isSilver ? '#0284c7' : '#475569',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 800,
                              fontSize: '13px',
                              flexShrink: 0
                            }}
                          >
                            {c.tradeName.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>
                              {c.tradeName}
                            </strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {c.corporateName}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* CNPJ & Contato */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>{c.cnpj}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{c.phone}</div>
                      </td>

                      {/* Localização */}
                      <td style={{ padding: '14px 14px', fontSize: '12px', color: '#334155' }}>
                        {c.city} - {c.state}
                      </td>

                      {/* SLA */}
                      <td style={{ padding: '14px 14px' }}>
                        <span
                          className={`nesher-sla-badge ${
                            isGold ? 'ouro' : isSilver ? 'prata' : 'basico'
                          }`}
                        >
                          <i className="ti ti-shield-check" />
                          {c.slaPlan}
                        </span>
                      </td>

                      {/* Ativos */}
                      <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, color: '#475569', background: '#f1f5f9', padding: '3px 8px', borderRadius: '6px' }}>
                          <i className="ti ti-devices" />
                          {c.devicesCount}
                        </span>
                      </td>

                      {/* Chamados */}
                      <td style={{ padding: '14px 14px', textAlign: 'center' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            fontWeight: 700,
                            color: c.activeTicketsCount > 0 ? '#b45309' : '#15803d',
                            background: c.activeTicketsCount > 0 ? '#fef3c7' : '#dcfce7',
                            padding: '3px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          <i className="ti ti-ticket" />
                          {c.activeTicketsCount}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 14px' }}>
                        <span
                          className={`nesher-badge ${
                            c.status === 'Aprovada'
                              ? 'aprovada'
                              : c.status === 'Pendente'
                              ? 'pendente'
                              : 'bloqueada'
                          }`}
                        >
                          <i
                            className={
                              c.status === 'Aprovada'
                                ? 'ti ti-check'
                                : c.status === 'Pendente'
                                ? 'ti ti-clock'
                                : 'ti ti-ban'
                            }
                          />
                          {c.status}
                        </span>
                      </td>

                      {/* Ações */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                          {c.status === 'Pendente' ? (
                            <button
                              type="button"
                              onClick={(e) => handleApproveCompany(c.id, e)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: '#16a34a',
                                color: '#ffffff',
                                border: 0,
                                padding: '6px 11px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                              title="Aprovar e ativar empresa"
                            >
                              <i className="ti ti-check" />
                              Aprovar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCompany(c);
                              }}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: '#eff6ff',
                                color: '#1d4ed8',
                                border: '1px solid #bfdbfe',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              <i className="ti ti-id" />
                              Ficha
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer: Ficha Completa da Empresa */}
      {selectedCompany && (
        <div className="nesher-drawer-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="nesher-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="nesher-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#e0f2fe',
                    color: '#0369a1',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: '15px'
                  }}
                >
                  {selectedCompany.tradeName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    {selectedCompany.tradeName}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    CNPJ: {selectedCompany.cnpj}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                style={{ background: 'none', border: 0, color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Tab Bar */}
            <div className="nesher-tab-bar" style={{ padding: '0 24px' }}>
              <button
                type="button"
                className={`nesher-tab-btn ${drawerTab === 'info' ? 'is-active' : ''}`}
                onClick={() => setDrawerTab('info')}
              >
                <i className="ti ti-file-text" />
                <span>Dados & SLA</span>
              </button>
              <button
                type="button"
                className={`nesher-tab-btn ${drawerTab === 'members' ? 'is-active' : ''}`}
                onClick={() => setDrawerTab('members')}
              >
                <i className="ti ti-users" />
                <span>Colaboradores ({selectedCompany.members.length})</span>
              </button>
              <button
                type="button"
                className={`nesher-tab-btn ${drawerTab === 'devices' ? 'is-active' : ''}`}
                onClick={() => setDrawerTab('devices')}
              >
                <i className="ti ti-devices" />
                <span>Inventário ({selectedCompany.devices.length})</span>
              </button>
              <button
                type="button"
                className={`nesher-tab-btn ${drawerTab === 'tickets' ? 'is-active' : ''}`}
                onClick={() => setDrawerTab('tickets')}
              >
                <i className="ti ti-ticket" />
                <span>Chamados ({selectedCompany.tickets.length})</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="nesher-drawer-body">
              {drawerTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {/* Status Banner */}
                  <div
                    style={{
                      padding: '14px 18px',
                      borderRadius: '10px',
                      background: selectedCompany.status === 'Aprovada' ? '#ecfdf5' : selectedCompany.status === 'Pendente' ? '#fffbeb' : '#fef2f2',
                      border: '1px solid',
                      borderColor: selectedCompany.status === 'Aprovada' ? '#a7f3d0' : selectedCompany.status === 'Pendente' ? '#fde68a' : '#fecaca',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block' }}>
                        Status do Cadastro: {selectedCompany.status}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Cadastrado em {selectedCompany.createdAt} • Início do Contrato: {selectedCompany.contractStart}
                      </span>
                    </div>
                    {selectedCompany.status === 'Pendente' && (
                      <button
                        type="button"
                        onClick={() => handleApproveCompany(selectedCompany.id)}
                        style={{
                          background: '#16a34a',
                          color: '#fff',
                          border: 0,
                          padding: '7px 14px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Aprovar Agora
                      </button>
                    )}
                  </div>

                  {/* Informações Cadastrais */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                      Dados Empresariais
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Razão Social</span>
                        <strong style={{ color: '#0f172a' }}>{selectedCompany.corporateName}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Nome Fantasia</span>
                        <strong style={{ color: '#0f172a' }}>{selectedCompany.tradeName}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>CNPJ</span>
                        <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{selectedCompany.cnpj}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Telefone Geral</span>
                        <span style={{ color: '#0f172a' }}>{selectedCompany.phone}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>E-mail Administrativo</span>
                        <span style={{ color: '#0f172a' }}>{selectedCompany.email}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Cidade / Estado</span>
                        <span style={{ color: '#0f172a' }}>{selectedCompany.city} - {selectedCompany.state}</span>
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Endereço Completo</span>
                        <span style={{ color: '#0f172a' }}>{selectedCompany.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* SLA Info Card */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                        Acordo de Nível de Serviço (SLA)
                      </h4>
                      <span className={`nesher-sla-badge ${selectedCompany.slaPlan.includes('Ouro') ? 'ouro' : selectedCompany.slaPlan.includes('Prata') ? 'prata' : 'basico'}`}>
                        {selectedCompany.slaPlan}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6 }}>
                      {selectedCompany.slaPlan.includes('Ouro') && (
                        <p style={{ margin: 0 }}>
                          🚀 <b>Cobertura 24x7</b> • Tempo de primeira resposta: <b>até 30 minutos</b> para incidentes críticos.
                          Suporte a campo emergencial com deslocamento de até 2 horas.
                        </p>
                      )}
                      {selectedCompany.slaPlan.includes('Prata') && (
                        <p style={{ margin: 0 }}>
                          ⚡ <b>Cobertura 12x5 (Seg a Sex das 07h às 19h)</b> • Primeira resposta: <b>até 2 horas</b>.
                          Visitas presenciais agendadas em até 24 horas úteis.
                        </p>
                      )}
                      {selectedCompany.slaPlan.includes('Básico') && (
                        <p style={{ margin: 0 }}>
                          💼 <b>Cobertura 8x5 (Seg a Sex das 08h às 17h)</b> • Primeira resposta: <b>até 4 horas</b>.
                          Atendimento primordialmente remoto.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Gestor da Conta */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                      Gestor da Empresa (Ponto Focal)
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: '12px' }}>
                        {selectedCompany.managerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>{selectedCompany.managerName}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{selectedCompany.managerEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Aba: Colaboradores (Zammad Style) */}
              {drawerTab === 'members' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        Colaboradores Autorizados
                      </h4>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Pessoas cadastradas na empresa com permissão para abrir chamados.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAddMemberModalOpen(true)}
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 0,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="ti ti-user-plus" />
                      + Convidar Colaborador
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCompany.members.map((member) => (
                      <div
                        key={member.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          background: '#ffffff'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: member.accessLevel === 'Gestor da Empresa' ? '#dbeafe' : '#f1f5f9',
                              color: member.accessLevel === 'Gestor da Empresa' ? '#1d4ed8' : '#475569',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 800,
                              fontSize: '11px'
                            }}
                          >
                            {member.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: '12px', color: '#0f172a' }}>
                              {member.name}
                            </strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {member.role} • {member.department}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: member.accessLevel === 'Gestor da Empresa' ? '#dcfce7' : '#f1f5f9',
                              color: member.accessLevel === 'Gestor da Empresa' ? '#15803d' : '#475569'
                            }}
                          >
                            {member.accessLevel}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Aba: Dispositivos & Inventário (GLPI Style) */}
              {drawerTab === 'devices' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        Equipamentos Alocados nesta Empresa
                      </h4>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Inventário de ativos vinculado ao contrato com número de patrimônio e serial.
                      </span>
                    </div>
                    <Link
                      href="/dashboard/equipamentos"
                      style={{
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        border: '1px solid #bfdbfe',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="ti ti-external-link" />
                      Abrir Inventário Completo
                    </Link>
                  </div>

                  {selectedCompany.devices.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                      <i className="ti ti-devices-off" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }} />
                      <span>Nenhum equipamento cadastrado para esta empresa ainda.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedCompany.devices.map((device) => (
                        <div
                          key={device.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: '#2563eb', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>
                                {device.tag}
                              </span>
                              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{device.model}</strong>
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', display: 'block', marginTop: '4px' }}>
                              Serial: {device.serial} • Alocado a: <b>{device.user}</b>
                            </span>
                          </div>
                          <span
                            className={`nesher-badge ${
                              device.status === 'Operacional' ? 'operacional' : 'manutencao'
                            }`}
                          >
                            {device.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Aba: Chamados Recentes */}
              {drawerTab === 'tickets' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        Histórico de Chamados
                      </h4>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Ordens de serviço e chamados de suporte abertos por esta empresa.
                      </span>
                    </div>
                    <Link
                      href="/dashboard/chamados"
                      style={{
                        background: '#2563eb',
                        color: '#fff',
                        border: 0,
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <i className="ti ti-plus" />
                      Novo Chamado
                    </Link>
                  </div>

                  {selectedCompany.tickets.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                      <i className="ti ti-ticket-off" style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }} />
                      <span>Nenhum chamado registrado para esta empresa até o momento.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedCompany.tickets.map((t) => (
                        <div
                          key={t.id}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                          }}
                        >
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '11px', color: '#2563eb' }}>{t.code}</span>
                              <strong style={{ fontSize: '12px', color: '#0f172a' }}>{t.subject}</strong>
                            </div>
                            <span style={{ fontSize: '10px', color: '#64748b', display: 'block', marginTop: '3px' }}>
                              {t.createdAt} • Prioridade: <b>{t.priority}</b>
                            </span>
                          </div>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e40af', background: '#dbeafe', padding: '3px 8px', borderRadius: '6px' }}>
                            {t.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="nesher-drawer-footer">
              <button
                type="button"
                onClick={() => handleToggleBlock(selectedCompany.id)}
                style={{
                  background: selectedCompany.status === 'Bloqueada' ? '#ecfdf5' : '#fef2f2',
                  color: selectedCompany.status === 'Bloqueada' ? '#047857' : '#b91c1c',
                  border: '1px solid',
                  borderColor: selectedCompany.status === 'Bloqueada' ? '#a7f3d0' : '#fecaca',
                  padding: '8px 14px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                {selectedCompany.status === 'Bloqueada' ? 'Desbloquear Empresa' : 'Bloquear Acesso'}
              </button>
              <button
                type="button"
                className="nesher-primary-button"
                onClick={() => setSelectedCompany(null)}
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Cadastrar Nova Empresa */}
      {isCreateModalOpen && (
        <div className="nesher-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="nesher-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="nesher-modal-header">
              <h2>Cadastrar Nova Empresa Cliente</h2>
              <button type="button" className="nesher-modal-close" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateCompany}>
              <div className="nesher-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Nome Fantasia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Farmácias Vida Nova"
                      value={newTradeName}
                      onChange={(e) => setNewTradeName(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Razão Social
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Drogaria & Farmácia Vida Nova Ltda"
                      value={newCorpName}
                      onChange={(e) => setNewCorpName(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      CNPJ *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="00.000.000/0001-00"
                      value={newCnpj}
                      onChange={(e) => setNewCnpj(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Telefone Geral
                    </label>
                    <input
                      type="text"
                      placeholder="(11) 3000-0000"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      E-mail Administrativo / TI *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="contato@empresa.com.br"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Gestor Principal
                    </label>
                    <input
                      type="text"
                      placeholder="Nome do responsável técnico"
                      value={newManager}
                      onChange={(e) => setNewManager(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Cidade
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Plano de SLA Contratado
                    </label>
                    <select
                      value={newSla}
                      onChange={(e) => setNewSla(e.target.value as SLAPlan)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                    >
                      <option value="Ouro (24x7)">Ouro (24x7 - Suporte Total)</option>
                      <option value="Prata (12x5)">Prata (12x5 - Comercial Estendido)</option>
                      <option value="Básico (8x5)">Básico (8x5 - Horário Comercial)</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Endereço Completo
                    </label>
                    <input
                      type="text"
                      placeholder="Rua, Número, Bairro e CEP"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              <div className="nesher-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: 0, padding: '9px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="nesher-primary-button">
                  Salvar e Ativar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Colaborador à Empresa Selecionada */}
      {isAddMemberModalOpen && selectedCompany && (
        <div className="nesher-modal-overlay" onClick={() => setIsAddMemberModalOpen(false)}>
          <div className="nesher-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="nesher-modal-header">
              <h2>Novo Colaborador • {selectedCompany.tradeName}</h2>
              <button type="button" className="nesher-modal-close" onClick={() => setIsAddMemberModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="nesher-modal-body">
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Beatriz Lima"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    E-mail Corporativo *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="beatriz@empresa.com.br"
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Cargo
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Analista Financeiro"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Departamento
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Contabilidade"
                      value={newMemberDept}
                      onChange={(e) => setNewMemberDept(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Nível de Acesso no Portal
                  </label>
                  <select
                    value={newMemberLevel}
                    onChange={(e) => setNewMemberLevel(e.target.value as any)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                  >
                    <option value="Solicitante">Solicitante (Abre e acompanha apenas seus chamados)</option>
                    <option value="Gestor da Empresa">Gestor da Empresa (Visualiza chamados e inventário de todos)</option>
                  </select>
                </div>
              </div>

              <div className="nesher-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAddMemberModalOpen(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: 0, padding: '9px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="nesher-primary-button">
                  Adicionar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
