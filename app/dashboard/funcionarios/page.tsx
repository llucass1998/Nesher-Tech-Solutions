'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  companyId: string;
  companyName: string;
  department: string;
  role: string;
  status: 'Ativo' | 'Inativo';
  ticketsCount: number;
}

export default function FuncionariosPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    companyId: '',
    department: 'TI / Operações',
    role: 'Analista',
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
            setNewEmployee((prev) => ({ ...prev, companyId: approved[0].id }));
          }
        }
      }

      const rawEmployees = window.localStorage.getItem('nesher_employees');
      if (rawEmployees) {
        setEmployees(JSON.parse(rawEmployees));
      } else {
        setEmployees([]);
      }
    } catch {}
  }, []);

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email || !newEmployee.companyId) return;

    const comp = companies.find((c) => c.id === newEmployee.companyId);
    const emp: Employee = {
      id: 'emp-' + Date.now(),
      name: newEmployee.name,
      email: newEmployee.email,
      phone: newEmployee.phone,
      companyId: newEmployee.companyId,
      companyName: comp ? comp.name : 'Empresa Cliente',
      department: newEmployee.department,
      role: newEmployee.role,
      status: 'Ativo',
      ticketsCount: 0,
    };

    const updated = [emp, ...employees];
    setEmployees(updated);
    try {
      window.localStorage.setItem('nesher_employees', JSON.stringify(updated));
    } catch {}

    setIsModalOpen(false);
    setNewEmployee({
      name: '',
      email: '',
      phone: '',
      companyId: companies[0]?.id || '',
      department: 'TI / Operações',
      role: 'Analista',
    });
  };

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompanyFilter === 'all' || emp.companyId === selectedCompanyFilter;
    return matchesSearch && matchesCompany;
  });

  return (
    <div className="nesher-dashboard">
      <div className="nesher-welcome-row">
        <div>
          <p className="nesher-eyebrow">CADASTRO &amp; CONTROLE DE USUÁRIOS</p>
          <h1>Funcionários &amp; Solicitantes</h1>
          <p className="nesher-welcome-copy">
            Gerenciamento de colaboradores autorizados a abrir e aprovar chamados técnicos por empresa.
          </p>
        </div>

        <button type="button" className="nesher-primary-button" onClick={() => setIsModalOpen(true)}>
          <i className="ti ti-user-plus" /> Novo Funcionário
        </button>
      </div>

      {/* Filters Bar */}
      <div className="nesher-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar por nome, e-mail ou departamento..."
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

      {/* Employee List */}
      <div className="nesher-panel" style={{ overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="nesher-empty-state" style={{ padding: '48px 20px', textAlign: 'center' }}>
            <i className="ti ti-users-off" style={{ fontSize: '38px', color: '#94a3b8', display: 'block', marginBottom: '12px' }} />
            <strong>Nenhum funcionário cadastrado</strong>
            <p style={{ margin: '6px 0 16px', fontSize: '12px', color: '#64748b' }}>
              Cadastre os solicitantes das empresas clientes para vincular equipamentos e abertura de chamados.
            </p>
            <button type="button" className="nesher-primary-button" style={{ margin: '0 auto' }} onClick={() => setIsModalOpen(true)}>
              <i className="ti ti-user-plus" /> Cadastrar Primeiro Funcionário
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '12px 16px' }}>Colaborador</th>
                  <th style={{ padding: '12px 16px' }}>Empresa</th>
                  <th style={{ padding: '12px 16px' }}>Departamento / Cargo</th>
                  <th style={{ padding: '12px 16px' }}>Contato</th>
                  <th style={{ padding: '12px 16px' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: '#e0f2fe',
                            color: '#0369a1',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 700,
                            fontSize: '11px',
                          }}
                        >
                          {emp.name.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <strong style={{ color: '#0f172a', display: 'block' }}>{emp.name}</strong>
                          <small style={{ color: '#64748b' }}>{emp.email}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="nesher-sla-badge" style={{ background: '#f1f5f9', color: '#334155' }}>
                        {emp.companyName}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontWeight: 600 }}>{emp.department}</span>
                      <small style={{ display: 'block', color: '#64748b' }}>{emp.role}</small>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#64748b' }}>{emp.phone || '-'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className="nesher-status em-atendimento" style={{ fontSize: '10px' }}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <Link
                        href={`/dashboard/chamados?solicitante=${encodeURIComponent(emp.name)}`}
                        className="nesher-select"
                        style={{ display: 'inline-flex', padding: '4px 8px' }}
                      >
                        <i className="ti ti-message-circle" /> Chamados
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Cadastro */}
      {isModalOpen && (
        <div className="nesher-preview-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="nesher-preview-modal-dialog" style={{ maxWidth: '540px', height: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="nesher-preview-modal-header">
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Cadastrar Novo Funcionário</h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '18px', cursor: 'pointer' }}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} style={{ padding: '20px' }}>
              <div className="nesher-form-group" style={{ marginBottom: '14px' }}>
                <label>Empresa Vinculada</label>
                {companies.length === 0 ? (
                  <p style={{ color: '#dc2626', fontSize: '11px', margin: '4px 0' }}>
                    Nenhuma empresa aprovada cadastrada. Cadastre uma empresa primeiro.
                  </p>
                ) : (
                  <select
                    className="nesher-form-select"
                    value={newEmployee.companyId}
                    onChange={(e) => setNewEmployee({ ...newEmployee, companyId: e.target.value })}
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

              <div className="nesher-form-row">
                <div className="nesher-form-group">
                  <label>Nome Completo</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                    required
                  />
                </div>
                <div className="nesher-form-group">
                  <label>E-mail Corporativo</label>
                  <input
                    type="email"
                    className="nesher-form-input"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="nesher-form-row">
                <div className="nesher-form-group">
                  <label>Departamento</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={newEmployee.department}
                    onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                  />
                </div>
                <div className="nesher-form-group">
                  <label>Cargo</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={newEmployee.role}
                    onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                  />
                </div>
              </div>

              <div className="nesher-form-group" style={{ marginBottom: '18px' }}>
                <label>Telefone / WhatsApp (Opcional)</label>
                <input
                  type="text"
                  className="nesher-form-input"
                  value={newEmployee.phone}
                  onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="nesher-select" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="nesher-primary-button" disabled={companies.length === 0}>
                  Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
