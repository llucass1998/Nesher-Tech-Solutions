'use client';

import { useState, useEffect } from 'react';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    if (!newUnit.name || !newUnit.companyId) return;

    const comp = companies.find((c) => c.id === newUnit.companyId);
    const unit: Unit = {
      id: 'unit-' + Date.now(),
      name: newUnit.name,
      companyId: newUnit.companyId,
      companyName: comp ? comp.name : 'Empresa Cliente',
      isHeadquarters: newUnit.isHeadquarters,
      address: newUnit.address,
      city: newUnit.city,
      state: newUnit.state,
      localContact: newUnit.localContact,
      contactPhone: newUnit.contactPhone,
    };

    const updated = [unit, ...units];
    setUnits(updated);
    try {
      window.localStorage.setItem('nesher_units', JSON.stringify(updated));
    } catch {}

    setIsModalOpen(false);
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

  return (
    <div className="nesher-dashboard">
      <div className="nesher-welcome-row">
        <div>
          <p className="nesher-eyebrow">ESTRUTURA FÍSICA &amp; PONTOS DE ATENDIMENTO</p>
          <h1>Unidades &amp; Filiais</h1>
          <p className="nesher-welcome-copy">
            Cadastro de matrizes, filiais e plantas industriais das empresas clientes atendidas pela Nesher Tech.
          </p>
        </div>

        <button type="button" className="nesher-primary-button" onClick={() => setIsModalOpen(true)}>
          <i className="ti ti-plus" /> Nova Unidade
        </button>
      </div>

      <div className="nesher-panel" style={{ overflow: 'hidden' }}>
        {units.length === 0 ? (
          <div className="nesher-empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <i className="ti ti-map-pin-off" style={{ fontSize: '38px', color: '#94a3b8', display: 'block', marginBottom: '12px' }} />
            <strong>Nenhuma filial ou unidade cadastrada</strong>
            <p style={{ margin: '6px 0 16px', fontSize: '12px', color: '#64748b' }}>
              Cadastre as localizações para orientar os técnicos de campo em visitas de suporte presencial.
            </p>
            <button type="button" className="nesher-primary-button" style={{ margin: '0 auto' }} onClick={() => setIsModalOpen(true)}>
              <i className="ti ti-plus" /> Cadastrar Primeira Unidade
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', padding: '16px' }}>
            {units.map((u) => (
              <div key={u.id} style={{ border: '1px solid #e2e8f0', borderRadius: '10px', padding: '16px', background: '#ffffff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{u.name}</strong>
                    <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>{u.companyName}</span>
                  </div>
                  {u.isHeadquarters ? (
                    <span className="nesher-sla-badge ouro" style={{ fontSize: '10px' }}>
                      Matriz
                    </span>
                  ) : (
                    <span className="nesher-sla-badge prata" style={{ fontSize: '10px' }}>
                      Filial
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px', margin: '12px 0' }}>
                  <div>
                    <i className="ti ti-map-pin" style={{ color: '#0b68d1', marginRight: '6px' }} />
                    {u.address ? `${u.address}, ${u.city} - ${u.state}` : `${u.city} - ${u.state}`}
                  </div>
                  {u.localContact && (
                    <div>
                      <i className="ti ti-user" style={{ color: '#0b68d1', marginRight: '6px' }} />
                      Contato local: <strong>{u.localContact}</strong> ({u.contactPhone || 'Sem telefone'})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Cadastro de Unidade */}
      {isModalOpen && (
        <div className="nesher-preview-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="nesher-preview-modal-dialog" style={{ maxWidth: '520px', height: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="nesher-preview-modal-header">
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Cadastrar Unidade / Filial</h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '18px', cursor: 'pointer' }}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <form onSubmit={handleSaveUnit} style={{ padding: '20px' }}>
              <div className="nesher-form-group" style={{ marginBottom: '14px' }}>
                <label>Empresa</label>
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
              </div>

              <div className="nesher-form-row">
                <div className="nesher-form-group">
                  <label>Nome da Unidade / Filial</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    placeholder="Ex: Matriz Faria Lima, Galpão Barueri"
                    value={newUnit.name}
                    onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                    required
                  />
                </div>
                <div className="nesher-form-group">
                  <label>Tipo de Unidade</label>
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

              <div className="nesher-form-group" style={{ marginBottom: '14px' }}>
                <label>Endereço Completo</label>
                <input
                  type="text"
                  className="nesher-form-input"
                  placeholder="Av. Paulista, 1000 - Bela Vista"
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
                    value={newUnit.city}
                    onChange={(e) => setNewUnit({ ...newUnit, city: e.target.value })}
                  />
                </div>
                <div className="nesher-form-group">
                  <label>UF</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={newUnit.state}
                    onChange={(e) => setNewUnit({ ...newUnit, state: e.target.value })}
                  />
                </div>
              </div>

              <div className="nesher-form-row">
                <div className="nesher-form-group">
                  <label>Responsável Local</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    placeholder="Nome do gerente ou TI local"
                    value={newUnit.localContact}
                    onChange={(e) => setNewUnit({ ...newUnit, localContact: e.target.value })}
                  />
                </div>
                <div className="nesher-form-group">
                  <label>Telefone do Local</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    placeholder="(11) 99999-9999"
                    value={newUnit.contactPhone}
                    onChange={(e) => setNewUnit({ ...newUnit, contactPhone: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" className="nesher-select" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="nesher-primary-button">
                  Salvar Unidade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
