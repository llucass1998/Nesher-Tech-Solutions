'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';

export type TechSpecialty =
  | 'Infraestrutura & Redes'
  | 'Servidores & Cloud'
  | 'Suporte Helpdesk N1/N2'
  | 'Técnico de Campo (Field Service)'
  | 'Hardware & Impressoras';

export type TechStatus = 'Disponível' | 'Em Atendimento' | 'Em Campo' | 'Ausente';

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialty: TechSpecialty;
  status: TechStatus;
  activeTicketsCount: number;
  resolvedTicketsCount: number;
  csatRating: number; // 0.0 - 5.0
  activeVisit?: string;
  avatarColor: string;
}

const initialTechs: Technician[] = [];

export default function TecnicosPage() {
  const [techs, setTechs] = useState<Technician[]>([]);
  const [search, setSearch] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<'Todas' | TechSpecialty>('Todas');
  const [statusFilter, setStatusFilter] = useState<'Todos' | TechStatus>('Todos');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Tech form
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newSpecialty, setNewSpecialty] = useState<TechSpecialty>('Suporte Helpdesk N1/N2');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('nesher_techs');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter((t: Technician) => !t.id.startsWith('tch-') || Number(t.id.replace('tch-', '')) > 100);
          setTechs(clean);
          return;
        }
      }
      setTechs([]);
      localStorage.setItem('nesher_techs', JSON.stringify([]));
    } catch {
      setTechs([]);
    }
  }, []);

  const persistTechs = (updated: Technician[]) => {
    setTechs(updated);
    try {
      localStorage.setItem('nesher_techs', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredTechs = useMemo(() => {
    return techs.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.email.toLowerCase().includes(search.toLowerCase()) ||
        t.specialty.toLowerCase().includes(search.toLowerCase());

      const matchSpec = specialtyFilter === 'Todas' ? true : t.specialty === specialtyFilter;
      const matchStatus = statusFilter === 'Todos' ? true : t.status === statusFilter;

      return matchSearch && matchSpec && matchStatus;
    });
  }, [techs, search, specialtyFilter, statusFilter]);

  const handleCreateTech = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      alert('Preencha o Nome e o E-mail do técnico.');
      return;
    }

    const colors = ['#2563eb', '#7c3aed', '#0891b2', '#d97706', '#059669'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newT: Technician = {
      id: `tech-${Date.now()}`,
      name: newName,
      email: newEmail,
      phone: newPhone || '(11) 90000-0000',
      specialty: newSpecialty,
      status: 'Disponível',
      activeTicketsCount: 0,
      resolvedTicketsCount: 0,
      csatRating: 5.0,
      avatarColor: randomColor
    };

    persistTechs([...techs, newT]);
    setIsCreateModalOpen(false);
    showToast(`Técnico ${newName} cadastrado na equipe!`);

    setNewName('');
    setNewEmail('');
    setNewPhone('');
  };

  return (
    <div className="nesher-dashboard">
      {toastMessage && (
        <div className="nesher-toast">
          <i className="ti ti-circle-check" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="nesher-page-header">
        <div className="nesher-page-header-info">
          <p className="nesher-eyebrow">EQUIPE TÉCNICA & NOC NESHER</p>
          <h1>Técnicos, Atendentes & Especialistas</h1>
          <p>
            Gestão da equipe técnica própria da Nesher Tech Solutions, disponibilidade em tempo real,
            filas de atendimento atribuídas, pontuação de satisfação CSAT e técnicos em campo.
          </p>
        </div>
        <div className="nesher-page-header-actions">
          <button
            type="button"
            className="nesher-primary-button"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <i className="ti ti-user-plus" />
            <span>Adicionar Técnico</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="nesher-metric-grid" style={{ marginBottom: '24px' }}>
        <div className="nesher-metric-card">
          <span className="nesher-metric-icon blue">
            <i className="ti ti-users" />
          </span>
          <div className="nesher-metric-main">
            <span>EQUIPE TOTAL</span>
            <strong>{techs.length}</strong>
            <small>Técnicos e analistas ativos</small>
          </div>
        </div>

        <div className="nesher-metric-card">
          <span className="nesher-metric-icon green">
            <i className="ti ti-activity" />
          </span>
          <div className="nesher-metric-main">
            <span>DISPONÍVEIS AGORA</span>
            <strong style={{ color: '#16a34a' }}>
              {techs.filter((t) => t.status === 'Disponível').length}
            </strong>
            <small>Prontos para novos chamados</small>
          </div>
        </div>

        <div className="nesher-metric-card">
          <span className="nesher-metric-icon orange">
            <i className="ti ti-car" />
          </span>
          <div className="nesher-metric-main">
            <span>EM ATENDIMENTO EM CAMPO</span>
            <strong style={{ color: '#ea580c' }}>
              {techs.filter((t) => t.status === 'Em Campo').length}
            </strong>
            <small>Visitas presenciais em curso</small>
          </div>
        </div>

        <div className="nesher-metric-card">
          <span className="nesher-metric-icon purple">
            <i className="ti ti-star" />
          </span>
          <div className="nesher-metric-main">
            <span>CSAT MÉDIO</span>
            <strong>4.9 / 5.0</strong>
            <small>Avaliação geral dos clientes</small>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="nesher-panel" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px' }}>
          <div style={{ position: 'relative', minWidth: '280px', flex: 1, maxWidth: '420px' }}>
            <i
              className="ti ti-search"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '16px' }}
            />
            <input
              type="text"
              placeholder="Buscar por Nome, E-mail ou Especialidade..."
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
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div>
              <select
                value={specialtyFilter}
                onChange={(e) => setSpecialtyFilter(e.target.value as any)}
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
                <option value="Todas">Todas as Especialidades</option>
                <option value="Infraestrutura & Redes">Infraestrutura & Redes</option>
                <option value="Servidores & Cloud">Servidores & Cloud</option>
                <option value="Suporte Helpdesk N1/N2">Suporte Helpdesk N1/N2</option>
                <option value="Técnico de Campo (Field Service)">Técnico de Campo (Field Service)</option>
                <option value="Hardware & Impressoras">Hardware & Impressoras</option>
              </select>
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
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
                <option value="Todos">Todos os Status</option>
                <option value="Disponível">Disponível</option>
                <option value="Em Atendimento">Em Atendimento</option>
                <option value="Em Campo">Em Campo</option>
                <option value="Ausente">Ausente</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Techs Cards Grid */}
      {filteredTechs.length === 0 ? (
        <div className="nesher-panel" style={{ padding: '56px 20px', textAlign: 'center', color: '#94a3b8' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#64748b', fontSize: 28 }}>
            <i className="ti ti-users" />
          </div>
          <strong style={{ display: 'block', fontSize: '15px', color: '#1e293b', marginBottom: '6px' }}>
            {techs.length === 0 ? 'Nenhum técnico cadastrado (Base Zerada)' : 'Nenhum técnico encontrado'}
          </strong>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', maxWidth: 420, marginLeft: 'auto', marginRight: 'auto' }}>
            {techs.length === 0
              ? 'A base de técnicos da equipe está limpa e pronta para os cadastros dos profissionais reais.'
              : 'Tente alterar os filtros de especialidade ou status.'}
          </p>
          {techs.length === 0 && (
            <button
              type="button"
              className="nesher-primary-button"
              onClick={() => setIsCreateModalOpen(true)}
              style={{ margin: '0 auto' }}
            >
              <i className="ti ti-user-plus" />
              <span>+ Adicionar Primeiro Técnico</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {filteredTechs.map((t) => {
            const initials = t.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2);

            return (
              <div
                key={t.id}
                className="nesher-panel"
                style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '12px',
                        background: t.avatarColor,
                        color: '#ffffff',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 800,
                        fontSize: '16px',
                        flexShrink: 0
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <strong style={{ display: 'block', fontSize: '14px', color: '#0f172a' }}>
                        {t.name}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{t.email}</span>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#2563eb', marginTop: '2px' }}>
                        {t.specialty}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`nesher-badge ${
                      t.status === 'Disponível'
                        ? 'aprovada'
                        : t.status === 'Em Campo'
                        ? 'alerta'
                        : t.status === 'Em Atendimento'
                        ? 'operacional'
                        : 'prata'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>

                {/* Active visit banner if in field */}
                {t.activeVisit && (
                  <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#92400e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <i className="ti ti-map-pin" />
                    <span>Atendimento presencial ativo: <b>{t.activeVisit}</b></span>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Chamados Ativos</span>
                    <strong style={{ fontSize: '13px', color: '#1e40af' }}>{t.activeTicketsCount} em fila</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Total Resolvidos</span>
                    <strong style={{ fontSize: '13px', color: '#15803d' }}>{t.resolvedTicketsCount} OS</strong>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Telefone / Whats</span>
                    <span style={{ color: '#334155' }}>{t.phone}</span>
                  </div>
                  <div>
                    <span style={{ color: '#64748b', display: 'block', fontSize: '10px' }}>Avaliação CSAT</span>
                    <span style={{ color: '#b45309', fontWeight: 700 }}>★ {t.csatRating.toFixed(1)}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                  <a
                    href={`https://wa.me/55${t.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      background: '#f1f5f9',
                      color: '#334155',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className="ti ti-brand-whatsapp" style={{ color: '#16a34a' }} />
                    WhatsApp
                  </a>
                  <Link
                    href="/dashboard/chamados"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <i className="ti ti-ticket" />
                    Ver Fila
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Novo Técnico */}
      {isCreateModalOpen && (
        <div className="nesher-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="nesher-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="nesher-modal-header">
              <h2>Adicionar Membro da Equipe Técnica</h2>
              <button type="button" className="nesher-modal-close" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateTech}>
              <div className="nesher-modal-body">
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Gabriel Monteiro"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    E-mail Institucional *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="gabriel.m@nesher.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Telefone / Celular
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98877-6655"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                    Especialidade Principal
                  </label>
                  <select
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value as any)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                  >
                    <option value="Suporte Helpdesk N1/N2">Suporte Helpdesk N1/N2</option>
                    <option value="Infraestrutura & Redes">Infraestrutura & Redes</option>
                    <option value="Servidores & Cloud">Servidores & Cloud</option>
                    <option value="Técnico de Campo (Field Service)">Técnico de Campo (Field Service)</option>
                    <option value="Hardware & Impressoras">Hardware & Impressoras</option>
                  </select>
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
                  Cadastrar Técnico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
