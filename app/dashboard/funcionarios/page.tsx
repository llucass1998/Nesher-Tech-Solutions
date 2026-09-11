'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export interface EmployeeAvatar {
  type: 'emoji' | 'initials' | 'image';
  value: string;
  bgColor?: string;
}

export interface Employee {
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
  avatar?: EmployeeAvatar;
}

const emojiPresets = ['👨‍💼', '👩‍💻', '👨‍🔧', '👩‍💼', '🧑‍💻', '🧔', '👩‍🔬', '🧑‍💼', '👷‍♂️', '🚀', '💼', '💻'];
const colorPresets = [
  { name: 'Azul Nesher', hex: '#0b68d1' },
  { name: 'Esmeralda', hex: '#059669' },
  { name: 'Violeta', hex: '#7c3aed' },
  { name: 'Âmbar', hex: '#d97706' },
  { name: 'Rosa Choque', hex: '#e11d48' },
  { name: 'Ciano', hex: '#0891b2' },
  { name: 'Grafite', hex: '#334155' },
];

export default function FuncionariosPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [companies, setCompanies] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Avatar Builder State for New Employee
  const [avatarTab, setAvatarTab] = useState<'emoji' | 'initials' | 'image'>('emoji');
  const [selectedEmoji, setSelectedEmoji] = useState('👨‍💼');
  const [selectedColor, setSelectedColor] = useState('#0b68d1');
  const [customImageUrl, setCustomImageUrl] = useState('');

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    phone: '',
    companyId: '',
    department: 'TI / Operações',
    role: 'Analista',
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64 = uploadEvent.target?.result as string;
        setCustomImageUrl(base64);
        setAvatarTab('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name.trim() || !newEmployee.email.trim() || !newEmployee.companyId) {
      showToast('Por favor, preencha o nome, e-mail e selecione a empresa.');
      return;
    }

    const comp = companies.find((c) => c.id === newEmployee.companyId);

    // Build chosen avatar
    let avatar: EmployeeAvatar;
    if (avatarTab === 'emoji') {
      avatar = { type: 'emoji', value: selectedEmoji, bgColor: '#f1f5f9' };
    } else if (avatarTab === 'image' && customImageUrl) {
      avatar = { type: 'image', value: customImageUrl };
    } else {
      const initials = newEmployee.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('') || 'CL';
      avatar = { type: 'initials', value: initials, bgColor: selectedColor };
    }

    const emp: Employee = {
      id: 'emp-' + Date.now(),
      name: newEmployee.name.trim(),
      email: newEmployee.email.trim(),
      phone: newEmployee.phone.trim(),
      companyId: newEmployee.companyId,
      companyName: comp ? comp.name : 'Empresa Cliente',
      department: newEmployee.department.trim() || 'Geral',
      role: newEmployee.role.trim() || 'Colaborador',
      status: 'Ativo',
      ticketsCount: 0,
      avatar,
    };

    const updated = [emp, ...employees];
    setEmployees(updated);
    try {
      window.localStorage.setItem('nesher_employees', JSON.stringify(updated));
    } catch {}

    setIsDrawerOpen(false);
    showToast(`Colaborador ${emp.name} cadastrado com sucesso!`);

    // Reset form
    setNewEmployee({
      name: '',
      email: '',
      phone: '',
      companyId: companies[0]?.id || '',
      department: 'TI / Operações',
      role: 'Analista',
    });
    setCustomImageUrl('');
    setSelectedEmoji('👨‍💼');
  };

  const handleDeleteEmployee = (id: string, name: string) => {
    if (confirm(`Deseja realmente remover o colaborador "${name}"?`)) {
      const updated = employees.filter((e) => e.id !== id);
      setEmployees(updated);
      try {
        window.localStorage.setItem('nesher_employees', JSON.stringify(updated));
      } catch {}
      showToast(`Colaborador "${name}" removido.`);
    }
  };

  const filtered = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCompany = selectedCompanyFilter === 'all' || emp.companyId === selectedCompanyFilter;
    return matchesSearch && matchesCompany;
  });

  const computedInitials = newEmployee.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join('') || 'CL';

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
          <p className="nesher-eyebrow">CADASTRO &amp; CONTROLE DE USUÁRIOS</p>
          <h1>Funcionários &amp; Solicitantes</h1>
          <p className="nesher-welcome-copy">
            Gerenciamento de colaboradores autorizados a abrir chamados técnicos e solicitar visitas por empresa.
          </p>
        </div>

        <button type="button" className="nesher-primary-button" onClick={() => setIsDrawerOpen(true)}>
          <i className="ti ti-user-plus" /> Novo Funcionário
        </button>
      </div>

      {/* Filters Bar */}
      <div className="nesher-panel" style={{ padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Buscar por nome, e-mail, departamento ou cargo..."
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
          <div className="nesher-empty-state" style={{ padding: '56px 20px', textAlign: 'center' }}>
            <i className="ti ti-users-off" style={{ fontSize: '42px', color: '#94a3b8', display: 'block', marginBottom: '12px' }} />
            <strong style={{ fontSize: '16px', color: '#0f172a' }}>Nenhum funcionário cadastrado</strong>
            <p style={{ margin: '6px 0 20px', fontSize: '12px', color: '#64748b', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              Cadastre os solicitantes das empresas clientes para vincular seus equipamentos, histórico de chamados e visitas presenciais.
            </p>
            <button type="button" className="nesher-primary-button" style={{ margin: '0 auto' }} onClick={() => setIsDrawerOpen(true)}>
              <i className="ti ti-user-plus" /> Cadastrar Primeiro Funcionário
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left', color: '#64748b' }}>
                  <th style={{ padding: '14px 18px' }}>Colaborador</th>
                  <th style={{ padding: '14px 18px' }}>Empresa</th>
                  <th style={{ padding: '14px 18px' }}>Departamento / Cargo</th>
                  <th style={{ padding: '14px 18px' }}>Contato</th>
                  <th style={{ padding: '14px 18px' }}>Status</th>
                  <th style={{ padding: '14px 18px', textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} style={{ borderBottom: '1px solid #edf2f7', transition: 'background 0.15s' }}>
                    <td style={{ padding: '12px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {emp.avatar?.type === 'image' ? (
                          <img
                            src={emp.avatar.value}
                            alt={emp.name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #e2e8f0' }}
                          />
                        ) : emp.avatar?.type === 'emoji' ? (
                          <span
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: '#f1f5f9',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '18px',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {emp.avatar.value}
                          </span>
                        ) : (
                          <span
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: emp.avatar?.bgColor || '#0b68d1',
                              color: '#ffffff',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 800,
                              fontSize: '12px',
                            }}
                          >
                            {emp.avatar?.value || emp.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <strong style={{ color: '#0f172a', display: 'block', fontSize: '13px' }}>{emp.name}</strong>
                          <small style={{ color: '#64748b' }}>{emp.email}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span className="nesher-sla-badge" style={{ background: '#f1f5f9', color: '#0f172a', fontWeight: 600 }}>
                        {emp.companyName}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>{emp.department}</span>
                      <small style={{ display: 'block', color: '#64748b' }}>{emp.role}</small>
                    </td>
                    <td style={{ padding: '12px 18px', color: '#64748b' }}>{emp.phone || '-'}</td>
                    <td style={{ padding: '12px 18px' }}>
                      <span className="nesher-status em-atendimento" style={{ fontSize: '10px' }}>
                        {emp.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link
                          href={`/dashboard/chamados?solicitante=${encodeURIComponent(emp.name)}`}
                          className="nesher-select"
                          style={{ padding: '5px 10px', fontSize: '11px', fontWeight: 700 }}
                          title="Ver chamados deste funcionário"
                        >
                          <i className="ti ti-message-circle" /> Chamados
                        </Link>
                        <button
                          type="button"
                          className="nesher-select"
                          style={{ padding: '5px 8px', color: '#dc2626' }}
                          title="Remover colaborador"
                          onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                        >
                          <i className="ti ti-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* SLIDE-OVER DRAWER MODAL DE CADASTRO COM AVATAR BUILDER    */}
      {/* ========================================================= */}
      {isDrawerOpen && (
        <div className="nesher-drawer-backdrop" onClick={() => setIsDrawerOpen(false)}>
          <div className="nesher-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="nesher-drawer-header">
              <div>
                <h3>Cadastrar Novo Funcionário</h3>
                <p>Crie o perfil do solicitante e personalize o avatar que aparecerá nos chamados.</p>
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

            <form onSubmit={handleSaveEmployee} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div className="nesher-drawer-body">
                {/* 1. SEÇÃO DE AVATAR BUILDER INTERATIVO */}
                <div
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '18px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    Personalizar Avatar do Colaborador
                  </label>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px', flexWrap: 'wrap' }}>
                    {/* Live Avatar Preview */}
                    <div style={{ textAlign: 'center' }}>
                      {avatarTab === 'image' && customImageUrl ? (
                        <img
                          src={customImageUrl}
                          alt="Preview"
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '3px solid #0b68d1',
                            boxShadow: '0 4px 12px rgba(11,104,209,0.25)',
                          }}
                        />
                      ) : avatarTab === 'emoji' ? (
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#eff6ff',
                            border: '3px solid #0b68d1',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '32px',
                            boxShadow: '0 4px 12px rgba(11,104,209,0.2)',
                          }}
                        >
                          {selectedEmoji}
                        </div>
                      ) : (
                        <div
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: selectedColor,
                            color: '#ffffff',
                            display: 'grid',
                            placeItems: 'center',
                            fontWeight: 800,
                            fontSize: '20px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                          }}
                        >
                          {computedInitials}
                        </div>
                      )}
                      <small style={{ display: 'block', marginTop: '4px', fontSize: '10px', color: '#64748b' }}>Prévia ao vivo</small>
                    </div>

                    <div style={{ flex: 1 }}>
                      {/* Avatar Style Switcher */}
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                        <button
                          type="button"
                          className={`nesher-select ${avatarTab === 'emoji' ? 'is-active' : ''}`}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: avatarTab === 'emoji' ? '#0b68d1' : '#f1f5f9',
                            color: avatarTab === 'emoji' ? '#ffffff' : '#334155',
                          }}
                          onClick={() => setAvatarTab('emoji')}
                        >
                          😊 Memoji
                        </button>
                        <button
                          type="button"
                          className={`nesher-select ${avatarTab === 'initials' ? 'is-active' : ''}`}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: avatarTab === 'initials' ? '#0b68d1' : '#f1f5f9',
                            color: avatarTab === 'initials' ? '#ffffff' : '#334155',
                          }}
                          onClick={() => setAvatarTab('initials')}
                        >
                          🔤 Monograma
                        </button>
                        <button
                          type="button"
                          className={`nesher-select ${avatarTab === 'image' ? 'is-active' : ''}`}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: avatarTab === 'image' ? '#0b68d1' : '#f1f5f9',
                            color: avatarTab === 'image' ? '#ffffff' : '#334155',
                          }}
                          onClick={() => setAvatarTab('image')}
                        >
                          📷 Foto
                        </button>
                      </div>

                      {avatarTab === 'emoji' && (
                        <div className="nesher-avatar-picker-grid" style={{ gridTemplateColumns: 'repeat(6, 1fr)' }}>
                          {emojiPresets.map((em) => (
                            <button
                              key={em}
                              type="button"
                              className={`nesher-avatar-choice-btn ${selectedEmoji === em ? 'is-selected' : ''}`}
                              onClick={() => setSelectedEmoji(em)}
                            >
                              {em}
                            </button>
                          ))}
                        </div>
                      )}

                      {avatarTab === 'initials' && (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {colorPresets.map((c) => (
                            <button
                              key={c.hex}
                              type="button"
                              onClick={() => setSelectedColor(c.hex)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '50%',
                                background: c.hex,
                                border: selectedColor === c.hex ? '3px solid #0f172a' : '2px solid transparent',
                                cursor: 'pointer',
                              }}
                              title={c.name}
                            />
                          ))}
                        </div>
                      )}

                      {avatarTab === 'image' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              padding: '8px 16px',
                              background: '#0b68d1',
                              color: '#ffffff',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              width: 'fit-content',
                              boxShadow: '0 2px 6px rgba(11, 104, 209, 0.25)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <i className="ti ti-camera" style={{ fontSize: '15px' }} />
                            <span>{customImageUrl ? 'Alterar Foto...' : 'Selecionar Foto'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              style={{ display: 'none' }}
                            />
                          </label>

                          {customImageUrl ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
                                <i className="ti ti-check" /> Foto carregada
                              </span>
                              <button
                                type="button"
                                onClick={() => setCustomImageUrl('')}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: '#dc2626',
                                  fontSize: '11px',
                                  cursor: 'pointer',
                                  textDecoration: 'underline',
                                  padding: 0,
                                }}
                              >
                                Remover
                              </button>
                            </div>
                          ) : (
                            <small style={{ color: '#64748b', fontSize: '10.5px' }}>
                              PNG, JPG ou WEBP até 5MB.
                            </small>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. EMPRESA VINCULADA */}
                <div className="nesher-form-group" style={{ marginBottom: '14px' }}>
                  <label>
                    Empresa Vinculada <span style={{ color: '#dc2626' }}>*</span>
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
                      <strong>Atenção:</strong> Nenhuma empresa aprovada cadastrada no sistema.
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

                {/* 3. DADOS PESSOAIS */}
                <div className="nesher-form-row">
                  <div className="nesher-form-group">
                    <label>
                      Nome Completo <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="text"
                      className="nesher-form-input"
                      placeholder="Ex: Carlos Eduardo Silva"
                      value={newEmployee.name}
                      onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                      required
                    >
                    </input>
                  </div>
                  <div className="nesher-form-group">
                    <label>
                      E-mail Corporativo <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <input
                      type="email"
                      className="nesher-form-input"
                      placeholder="carlos@empresa.com.br"
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
                      placeholder="Ex: Financeiro, TI, Almoxarifado"
                      value={newEmployee.department}
                      onChange={(e) => setNewEmployee({ ...newEmployee, department: e.target.value })}
                    />
                  </div>
                  <div className="nesher-form-group">
                    <label>Cargo / Função</label>
                    <input
                      type="text"
                      className="nesher-form-input"
                      placeholder="Ex: Analista Fiscal, Gerente"
                      value={newEmployee.role}
                      onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
                    />
                  </div>
                </div>

                <div className="nesher-form-group" style={{ marginBottom: '14px' }}>
                  <label>Telefone / WhatsApp (Para contato de campo)</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    placeholder="(11) 98765-4321"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({ ...newEmployee, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="nesher-drawer-footer">
                <button type="button" className="nesher-select" onClick={() => setIsDrawerOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="nesher-primary-button" disabled={companies.length === 0}>
                  <i className="ti ti-check" /> Salvar Colaborador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
