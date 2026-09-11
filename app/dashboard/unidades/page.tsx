'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Unit {
  id: string;
  name: string;
  companyId: string;
  companyName: string;
  isHeadquarters: boolean;
  address: string;
  city: string;
  state: string;
  localContact: string;
  contactPhone: string;
}

export default function UnidadesPage() {
  const [units, setUnits] = useState<Unit[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [newUnit, setNewUnit] = useState({
    name: '',
    companyId: '',
    isHeadquarters: false,
    address: '',
    city: 'São Paulo',
    state: 'SP',
    localContact: '',
    contactPhone: '',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

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
            }));
          setCompanies(approved);
          if (approved.length > 0) {
            setNewUnit((prev) => ({ ...prev, companyId: approved[0].id }));
          }
        }
      }

      const rawUnits = window.localStorage.getItem('nesher_units');
      if (rawUnits) {
        setUnits(JSON.parse(rawUnits));
      } else {
        setUnits([]);
      }
    } catch {}
  }, []);

  const handleSaveUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUnit.name.trim() || !newUnit.companyId) {
      showToast('Por favor, preencha o nome da unidade e selecione a empresa.');
      return;
    }

    const comp = companies.find((c) => c.id === newUnit.companyId);
    const unit: Unit = {
      id: 'unit-' + Date.now(),
      name: newUnit.name.trim(),
      companyId: newUnit.companyId,
      companyName: comp ? comp.name : 'Empresa Cliente',
      isHeadquarters: newUnit.isHeadquarters,
      address: newUnit.address.trim(),
      city: newUnit.city.trim() || 'São Paulo',
      state: newUnit.state.trim() || 'SP',
      localContact: newUnit.localContact.trim(),
      contactPhone: newUnit.contactPhone.trim(),
    };

    const updated = [unit, ...units];
    setUnits(updated);
    try {
      window.localStorage.setItem('nesher_units', JSON.stringify(updated));
    } catch {}

    setIsDrawerOpen(false);
    showToast(`Unidade "${unit.name}" cadastrada com sucesso!`);

    setNewUnit({
      name: '',
      companyId: companies[0]?.id || '',
      isHeadquarters: false,
      address: '',
      city: 'São Paulo',
      state: 'SP',
      localContact: '',
      contactPhone: '',
    });
  };

  const handleDeleteUnit = (id: string, name: string) => {
    if (confirm(`Deseja realmente remover a unidade "${name}"?`)) {
      const updated = units.filter((u) => u.id !== id);
      setUnits(updated);
      try {
        window.localStorage.setItem('nesher_units', JSON.stringify(updated));
      } catch {}
      showToast(`Unidade "${name}" removida.`);
    }
  };

  const filtered = units.filter((u) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.companyName.toLowerCase().includes(q) ||
      u.address.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q) ||
      u.localContact.toLowerCase().includes(q);
    const matchesCompany = selectedCompanyFilter === 'all' || u.companyId === selectedCompanyFilter;
    return matchesSearch && matchesCompany;
  });

  return (
    <div className="nesher-dashboard">
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#071A36',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
            animation: 'nesher-toast-in 0.2s ease-out',
          }}
        >
          <i className="ti ti-circle-check" style={{ color: '#10b981', fontSize: '18px' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="nesher-welcome-row">
        <div>
          <p className="nesher-eyebrow">ESTRUTURA FÍSICA &amp; PONTOS DE ATENDIMENTO</p>
          <h1>Unidades &amp; Filiais</h1>
          <p className="nesher-welcome-copy">
            Cadastro de matrizes, filiais e plantas industriais das empresas clientes atendidas pela Nesher Tech.
          </p>
        </div>

        <button type="button" className="nesher-primary-button" onClick={() => setIsDrawerOpen(true)}>
          <i className="ti ti-plus" /> Nova Unidade
        </button>
      </div>

      {/* Filter Bar */}
      <div className="nesher-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar unidade por nome, endereço, cidade ou contato..."
              className="nesher-form-input"
              style={{ width: '100%', paddingLeft: '34px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <i
              className="ti ti-search"
              style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Filtrar Empresa:</span>
            <select
              className="nesher-form-select"
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
            >
              <option value="all">Todas as Empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Units Grid */}
      <div className="nesher-panel" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="nesher-empty-state" style={{ padding: '56px 20px', textAlign: 'center' }}>
            <i className="ti ti-map-pin-off" style={{ fontSize: '42px', color: '#94a3b8', display: 'block', marginBottom: '12px' }} />
            <strong style={{ fontSize: '16px', color: '#0f172a' }}>Nenhuma filial ou unidade cadastrada</strong>
            <p style={{ margin: '6px 0 20px', fontSize: '12px', color: '#64748b', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              Cadastre as localizações físicas para orientar os técnicos do NOC em rotas de visitas e ordens de serviço.
            </p>
            <button type="button" className="nesher-primary-button" style={{ margin: '0 auto' }} onClick={() => setIsDrawerOpen(true)}>
              <i className="ti ti-plus" /> Cadastrar Primeira Unidade
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', padding: '18px' }}>
            {filtered.map((u) => (
              <div
                key={u.id}
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '18px',
                  background: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '15px', color: '#0f172a', display: 'block' }}>{u.name}</strong>
                      <span style={{ fontSize: '11.5px', color: '#0b68d1', fontWeight: 700 }}>{u.companyName}</span>
                    </div>
                    {u.isHeadquarters ? (
                      <span className="nesher-sla-badge ouro" style={{ fontSize: '10px', padding: '3px 8px' }}>
                        👑 Matriz / Sede
                      </span>
                    ) : (
                      <span className="nesher-sla-badge prata" style={{ fontSize: '10px', padding: '3px 8px' }}>
                        🏢 Filial
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '6px', margin: '14px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <i className="ti ti-map-pin" style={{ color: '#0b68d1', marginTop: '2px', flexShrink: 0 }} />
                      <span>{u.address ? `${u.address}, ${u.city} - ${u.state}` : `${u.city} - ${u.state}`}</span>
                    </div>
                    {u.localContact && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ti ti-user" style={{ color: '#64748b', flexShrink: 0 }} />
                        <span>Contato: {u.localContact}</span>
                      </div>
                    )}
                    {u.contactPhone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="ti ti-phone" style={{ color: '#64748b', flexShrink: 0 }} />
                        <span>{u.contactPhone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <Link
                    href={`/dashboard/visitas?unidade=${encodeURIComponent(u.name)}`}
                    className="nesher-select"
                    style={{ fontSize: '11px', padding: '4px 10px', fontWeight: 700 }}
                  >
                    <i className="ti ti-calendar-event" /> Visitas
                  </Link>
                  <button
                    type="button"
                    className="nesher-select"
                    style={{ fontSize: '11px', padding: '4px 8px', color: '#dc2626' }}
                    onClick={() => handleDeleteUnit(u.id, u.name)}
                    title="Excluir unidade"
                  >
                    <i className="ti ti-trash" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SLIDE-OVER DRAWER MODAL DE CADASTRO DE UNIDADE / FILIAL   */}
      {/* ========================================================= */}
      {isDrawerOpen && (
        <div className="nesher-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="nesher-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="nesher-drawer-header">
              <div>
                <h3>Cadastrar Unidade / Filial</h3>
                <p>Estrutura física para roteirização e agendamento de atendimentos presenciais.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#ffffff', fontSize: '22px', cursor: 'pointer' }}
                aria-label="Fechar"
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="nesher-drawer-body">
                {/* 1. SELEÇÃO DE EMPRESA */}
                <div className="nesher-form-group" style={{ marginBottom: '14px' }}>
                  <label>
                    Empresa Proprietária <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  {companies.length === 0 ? (
                    <div
                      style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '12px',
                        color: '#991b1b',
                        fontSize: '12px',
                      }}
                    >
                      <strong>Atenção:</strong> Nenhuma empresa cadastrada para vincular a filial.
                      <div style={{ marginTop: '8px' }}>
                        <Link
                          href="/dashboard/empresas"
                          className="nesher-primary-button"
                          style={{ fontSize: '11px', padding: '6px 12px', display: 'inline-flex' }}
                        >
                          <i className="ti ti-building-community" /> Cadastrar Empresa Primeiro
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <select
                      className="nesher-form-select"
                      value={newUnit.companyId}
                      onChange={(e) => setNewUnit({ ...newUnit, companyId: e.target.value })}
                      required
                    >
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* 2. NOME E TIPO */}
                <div className="nesher-form-row">
                  <div className="nesher-form-group">
                    <label>
                      Nome da Unidade / Filial <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="nesher-form-input"
                      placeholder="Ex: Matriz Faria Lima, Galpão 02"
                      value={newUnit.name}
                      onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="nesher-form-group">
                    <label>Tipo de Instalação</label>
                    <select
                      className="nesher-form-select"
                      value={newUnit.isHeadquarters ? 'true' : 'false'}
                      onChange={(e) => setNewUnit({ ...newUnit, isHeadquarters: e.target.value === 'true' })}
                    >
                      <option value="false">Filial Operacional</option>
                      <option value="true">Matriz / Sede Principal</option>
                    </select>
                  </div>
                </div>

                {/* 3. ENDEREÇO */}
                <div className="nesher-form-group" style={{ marginBottom: '14px' }}>
                  <label>Endereço Completo</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    placeholder="Av. Paulista, 1000, 14º andar - Bela Vista"
                    value={newUnit.address}
                    onChange={(e) => setNewUnit({ ...newUnit, address: e.target.value })}
                  />
                </div>

                <div className="nesher-form-row">
                  <div className="nesher-form-group">
                    <label>Cidade</label>
                    <input
                      type="text"
                      className="nesher-form-input"
                      placeholder="São Paulo"
                      value={newUnit.city}
                      onChange={(e) => setNewUnit({ ...newUnit, city: e.target.value })}
                    />
                  </div>
                  <div className="nesher-form-group">
                    <label>Estado (UF)</label>
                    <input
                      type="text"
                      className="nesher-form-input"
                      placeholder="SP"
                      value={newUnit.state}
                      onChange={(e) => setNewUnit({ ...newUnit, state: e.target.value })}
                    />
                  </div>
                </div>

                {/* 4. CONTATO LOCAL */}
                <div className="nesher-form-row">
                  <div className="nesher-form-group">
                    <label>Ponto Focal / Gerente Local</label>
                    <input
                      type="text"
                      className="nesher-form-input"
                      placeholder="Nome do responsável no local"
                      value={newUnit.localContact}
                      onChange={(e) => setNewUnit({ ...newUnit, localContact: e.target.value })}
                    />
                  </div>
                  <div className="nesher-form-group">
                    <label>Telefone da Recepção / Portaria</label>
                    <input
                      type="text"
                      className="nesher-form-input"
                      placeholder="(11) 3456-7890"
                      value={newUnit.contactPhone}
                      onChange={(e) => setNewUnit({ ...newUnit, contactPhone: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="nesher-drawer-footer">
                <button type="button" className="nesher-select" onClick={() => setIsDrawerOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="nesher-primary-button" disabled={companies.length === 0}>
                  <i className="ti ti-check" /> Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
