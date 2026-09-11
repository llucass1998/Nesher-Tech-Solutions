'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';

export type DeviceType = 'Notebook' | 'Desktop' | 'Servidor' | 'Impressora' | 'Rede / Switch' | 'Periférico';
export type DeviceStatus = 'Operacional' | 'Em Manutenção' | 'Reserva Técnica' | 'Baixa / Descarte';

export interface MaintenanceLog {
  id: string;
  date: string;
  ticketCode: string;
  type: 'Preventiva' | 'Corretiva' | 'Upgrade';
  technician: string;
  description: string;
}

export interface Device {
  id: string;
  tag: string;           // Nº de Patrimônio (ex: PAT-0104)
  serial: string;        // Número de Série
  type: DeviceType;
  brand: string;         // Dell, Lenovo, HP, Cisco, etc.
  model: string;
  companyName: string;   // Empresa cliente alocada
  companyId: string;
  department: string;
  assignedUser: string;  // Colaborador responsável
  status: DeviceStatus;
  cpu?: string;
  ram?: string;
  storage?: string;
  os?: string;
  ipAddress?: string;
  macAddress?: string;
  warrantyExpire?: string;
  acquisitionDate?: string;
  maintenanceHistory: MaintenanceLog[];
}

const initialDevices: Device[] = [];

export default function EquipamentosPage() {
  const [devices, setDevices] = useState<Device[]>(initialDevices);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'Todos' | DeviceType>('Todos');
  const [statusFilter, setStatusFilter] = useState<'Todos' | DeviceStatus>('Todos');
  const [companyFilter, setCompanyFilter] = useState('Todas');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [drawerTab, setDrawerTab] = useState<'specs' | 'history' | 'contract'>('specs');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [realCompanies, setRealCompanies] = useState<string[]>([]);

  // Load from localStorage on mount (and purge any old fake demo data)
  useState(() => {
    if (typeof window !== 'undefined') {
      try {
        const rawDevs = window.localStorage.getItem('nesher_devices');
        if (rawDevs) {
          const parsed = JSON.parse(rawDevs);
          const real = Array.isArray(parsed) ? parsed.filter((d: any) => !d.id?.startsWith('dev-') || Number(d.id.replace('dev-', '')) > 100) : [];
          setDevices(real);
        } else {
          setDevices([]);
        }

        const rawComps = window.localStorage.getItem('nesher_companies');
        if (rawComps) {
          const parsedC = JSON.parse(rawComps);
          if (Array.isArray(parsedC)) {
            const names = parsedC.map((c: any) => c.tradeName || c.corporateName).filter(Boolean);
            setRealCompanies(names);
          }
        }
      } catch {
        setDevices([]);
      }
    }
  });

  const persistDevices = (newDevs: Device[]) => {
    setDevices(newDevs);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('nesher_devices', JSON.stringify(newDevs));
      } catch {}
    }
  };

  // New Device Form States
  const [newTag, setNewTag] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [newType, setNewType] = useState<DeviceType>('Notebook');
  const [newBrand, setNewBrand] = useState('Dell');
  const [newModel, setNewModel] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newCpu, setNewCpu] = useState('');
  const [newRam, setNewRam] = useState('');
  const [newStorage, setNewStorage] = useState('');
  const [newOs, setNewOs] = useState('Windows 11 Pro');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Distinct companies in dataset + registered companies
  const availableCompanies = useMemo(() => {
    const set = new Set([...devices.map((d) => d.companyName), ...realCompanies]);
    return Array.from(set).filter(Boolean);
  }, [devices, realCompanies]);

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((d) => {
      const matchSearch =
        d.tag.toLowerCase().includes(search.toLowerCase()) ||
        d.serial.toLowerCase().includes(search.toLowerCase()) ||
        d.model.toLowerCase().includes(search.toLowerCase()) ||
        d.assignedUser.toLowerCase().includes(search.toLowerCase()) ||
        d.companyName.toLowerCase().includes(search.toLowerCase());

      const matchType = typeFilter === 'Todos' ? true : d.type === typeFilter;
      const matchStatus = statusFilter === 'Todos' ? true : d.status === statusFilter;
      const matchComp = companyFilter === 'Todas' ? true : d.companyName === companyFilter;

      return matchSearch && matchType && matchStatus && matchComp;
    });
  }, [devices, search, typeFilter, statusFilter, companyFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = devices.length;
    const operational = devices.filter((d) => d.status === 'Operacional').length;
    const maintenance = devices.filter((d) => d.status === 'Em Manutenção').length;
    const reserve = devices.filter((d) => d.status === 'Reserva Técnica').length;
    return { total, operational, maintenance, reserve };
  }, [devices]);

  const handleCreateDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag || !newModel) {
      alert('Preencha a Tag de Patrimônio e o Modelo do equipamento.');
      return;
    }

    const newDevice: Device = {
      id: `dev-${Date.now()}`,
      tag: newTag.toUpperCase(),
      serial: newSerial || `SN-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      type: newType,
      brand: newBrand,
      model: newModel,
      companyName: newCompany || (availableCompanies[0] || 'Empresa Cliente'),
      companyId: 'comp-custom',
      department: newDept || 'Geral',
      assignedUser: newUser || 'Uso compartilhado',
      status: 'Operacional',
      cpu: newCpu,
      ram: newRam,
      storage: newStorage,
      os: newOs,
      acquisitionDate: 'Hoje',
      warrantyExpire: '1 ano',
      maintenanceHistory: []
    };

    persistDevices([newDevice, ...devices]);
    setIsCreateModalOpen(false);
    showToast(`Equipamento ${newTag} adicionado ao inventário com sucesso!`);

    // Reset
    setNewTag('');
    setNewSerial('');
    setNewModel('');
    setNewDept('');
    setNewUser('');
    setNewCpu('');
    setNewRam('');
    setNewStorage('');
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
          <p className="nesher-eyebrow">GLPI STYLE CMDB • INVENTÁRIO DE TI</p>
          <h1>Gestão de Ativos & Equipamentos</h1>
          <p>
            Controle de computadores, notebooks, servidores, impressoras e ativos de rede de cada empresa cliente.
            Acompanhe especificações técnicas, números de série, garantias e histórico completo de manutenções.
          </p>
        </div>
        <div className="nesher-page-header-actions">
          <button
            type="button"
            className="nesher-primary-button"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <i className="ti ti-plus" />
            <span>Novo Equipamento</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="nesher-metric-grid" style={{ marginBottom: '24px' }}>
        <div className="nesher-metric-card">
          <span className="nesher-metric-icon blue">
            <i className="ti ti-devices" />
          </span>
          <div className="nesher-metric-main">
            <span>TOTAL DE ATIVOS</span>
            <strong>{stats.total}</strong>
            <small>Equipamentos cadastrados</small>
          </div>
        </div>

        <div className="nesher-metric-card">
          <span className="nesher-metric-icon green">
            <i className="ti ti-circle-check" />
          </span>
          <div className="nesher-metric-main">
            <span>OPERACIONAIS</span>
            <strong style={{ color: '#16a34a' }}>{stats.operational}</strong>
            <small>100% em funcionamento ativo</small>
          </div>
        </div>

        <div className="nesher-metric-card" style={{ borderLeft: stats.maintenance > 0 ? '3px solid #ea580c' : undefined }}>
          <span className="nesher-metric-icon orange">
            <i className="ti ti-tools" />
          </span>
          <div className="nesher-metric-main">
            <span>EM MANUTENÇÃO</span>
            <strong style={{ color: stats.maintenance > 0 ? '#ea580c' : undefined }}>{stats.maintenance}</strong>
            <small>Bancada ou aguardando peças</small>
          </div>
        </div>

        <div className="nesher-metric-card">
          <span className="nesher-metric-icon purple">
            <i className="ti ti-archive" />
          </span>
          <div className="nesher-metric-main">
            <span>RESERVA TÉCNICA (SWAP)</span>
            <strong>{stats.reserve}</strong>
            <small>Prontos para substituição rápida</small>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
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
              placeholder="Buscar por Patrimônio, Serial, Modelo ou Usuário..."
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

          {/* Type Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginRight: '2px' }}>Tipo:</span>
            {(['Todos', 'Notebook', 'Desktop', 'Servidor', 'Impressora', 'Rede / Switch'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: '1px solid',
                  borderColor: typeFilter === t ? '#2563eb' : '#e2e8f0',
                  background: typeFilter === t ? '#eff6ff' : '#ffffff',
                  color: typeFilter === t ? '#1d4ed8' : '#64748b'
                }}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Company and Status Dropdowns */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
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
                <option value="Todas">Todas as Empresas</option>
                {availableCompanies.map((comp) => (
                  <option key={comp} value={comp}>{comp}</option>
                ))}
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
                <option value="Operacional">Operacional</option>
                <option value="Em Manutenção">Em Manutenção</option>
                <option value="Reserva Técnica">Reserva Técnica</option>
                <option value="Baixa / Descarte">Baixa / Descarte</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Devices Data Table */}
      <div className="nesher-panel" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
              Equipamentos Listados ({filteredDevices.length})
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#64748b' }}>
              Clique em qualquer item para ver a ficha técnica detalhada, hardware, rede e histórico de manutenções.
            </p>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <th style={{ padding: '12px 18px', fontWeight: 700 }}>Patrimônio / Tipo</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Modelo & Fabricante</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Empresa Cliente</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Usuário / Setor</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Nº de Série (S/N)</th>
                <th style={{ padding: '12px 14px', fontWeight: 700 }}>Status</th>
                <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                    <i className="ti ti-devices-off" style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }} />
                    <strong style={{ display: 'block', fontSize: '14px', color: '#475569' }}>Nenhum ativo encontrado</strong>
                    <span style={{ fontSize: '12px' }}>Altere os filtros de busca ou cadastre um novo equipamento.</span>
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  const getIcon = (type: DeviceType) => {
                    switch (type) {
                      case 'Notebook': return 'ti-device-laptop';
                      case 'Desktop': return 'ti-device-desktop';
                      case 'Servidor': return 'ti-server';
                      case 'Impressora': return 'ti-printer';
                      case 'Rede / Switch': return 'ti-network';
                      default: return 'ti-devices';
                    }
                  };

                  return (
                    <tr
                      key={device.id}
                      onClick={() => setSelectedDevice(device)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        cursor: 'pointer',
                        transition: 'background 0.12s ease'
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Patrimônio & Ícone */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '8px',
                              background: '#eff6ff',
                              color: '#2563eb',
                              display: 'grid',
                              placeItems: 'center',
                              fontSize: '18px',
                              flexShrink: 0
                            }}
                          >
                            <i className={`ti ${getIcon(device.type)}`} />
                          </div>
                          <div>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                fontSize: '12px',
                                color: '#1e40af',
                                background: '#dbeafe',
                                padding: '2px 6px',
                                borderRadius: '4px'
                              }}
                            >
                              {device.tag}
                            </span>
                            <small style={{ display: 'block', color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                              {device.type}
                            </small>
                          </div>
                        </div>
                      </td>

                      {/* Modelo & Fabricante */}
                      <td style={{ padding: '14px 14px' }}>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>
                          {device.model}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {device.brand}
                        </span>
                      </td>

                      {/* Empresa */}
                      <td style={{ padding: '14px 14px', fontSize: '12px', color: '#334155' }}>
                        <strong>{device.companyName}</strong>
                      </td>

                      {/* Usuário / Setor */}
                      <td style={{ padding: '14px 14px' }}>
                        <div style={{ fontSize: '12px', color: '#0f172a', fontWeight: 600 }}>{device.assignedUser}</div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>{device.department}</div>
                      </td>

                      {/* Serial */}
                      <td style={{ padding: '14px 14px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#475569' }}>
                          {device.serial}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 14px' }}>
                        <span
                          className={`nesher-badge ${
                            device.status === 'Operacional'
                              ? 'operacional'
                              : device.status === 'Em Manutenção'
                              ? 'manutencao'
                              : device.status === 'Reserva Técnica'
                              ? 'aprovada'
                              : 'descarte'
                          }`}
                        >
                          <i
                            className={
                              device.status === 'Operacional'
                                ? 'ti ti-check'
                                : device.status === 'Em Manutenção'
                                ? 'ti ti-tool'
                                : 'ti ti-package'
                            }
                          />
                          {device.status}
                        </span>
                      </td>

                      {/* Ações */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDevice(device);
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
                          <i className="ti ti-file-certificate" />
                          Ficha Técnica
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer: Ficha Técnica GLPI */}
      {selectedDevice && (
        <div className="nesher-drawer-overlay" onClick={() => setSelectedDevice(null)}>
          <div className="nesher-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="nesher-drawer-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 800,
                    fontSize: '20px'
                  }}
                >
                  <i className="ti ti-devices" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '13px', color: '#1e40af', background: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>
                      {selectedDevice.tag}
                    </span>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                      {selectedDevice.model}
                    </h3>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {selectedDevice.companyName} • Alocado a: <b>{selectedDevice.assignedUser}</b>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDevice(null)}
                style={{ background: 'none', border: 0, color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Tab Bar */}
            <div className="nesher-tab-bar" style={{ padding: '0 24px' }}>
              <button
                type="button"
                className={`nesher-tab-btn ${drawerTab === 'specs' ? 'is-active' : ''}`}
                onClick={() => setDrawerTab('specs')}
              >
                <i className="ti ti-cpu" />
                <span>Hardware & Rede</span>
              </button>
              <button
                type="button"
                className={`nesher-tab-btn ${drawerTab === 'history' ? 'is-active' : ''}`}
                onClick={() => setDrawerTab('history')}
              >
                <i className="ti ti-history" />
                <span>Histórico de OS ({selectedDevice.maintenanceHistory.length})</span>
              </button>
              <button
                type="button"
                className={`nesher-tab-btn ${drawerTab === 'contract' ? 'is-active' : ''}`}
                onClick={() => setDrawerTab('contract')}
              >
                <i className="ti ti-shield-lock" />
                <span>Garantia & Vínculo</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="nesher-drawer-body">
              {drawerTab === 'specs' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Status Card */}
                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: selectedDevice.status === 'Operacional' ? '#ecfdf5' : '#fff7ed',
                      border: '1px solid',
                      borderColor: selectedDevice.status === 'Operacional' ? '#a7f3d0' : '#fed7aa',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: '12px', color: '#0f172a', display: 'block' }}>
                        Condição Operacional: {selectedDevice.status}
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Setor: {selectedDevice.department}
                      </span>
                    </div>
                    <span
                      className={`nesher-badge ${
                        selectedDevice.status === 'Operacional' ? 'operacional' : 'manutencao'
                      }`}
                    >
                      {selectedDevice.status}
                    </span>
                  </div>

                  {/* Hardware Grid */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                      Especificações de Hardware
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Fabricante / Marca</span>
                        <strong style={{ color: '#0f172a' }}>{selectedDevice.brand}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Modelo Exato</span>
                        <strong style={{ color: '#0f172a' }}>{selectedDevice.model}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Processador (CPU)</span>
                        <span style={{ color: '#0f172a' }}>{selectedDevice.cpu || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Memória RAM</span>
                        <span style={{ color: '#0f172a' }}>{selectedDevice.ram || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Armazenamento</span>
                        <span style={{ color: '#0f172a' }}>{selectedDevice.storage || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Sistema Operacional</span>
                        <span style={{ color: '#0f172a' }}>{selectedDevice.os || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rede e Conectividade */}
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                      Conectividade & Rede
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Endereço IP</span>
                        <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{selectedDevice.ipAddress || 'DHCP Automático'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>MAC Address</span>
                        <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{selectedDevice.macAddress || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Histórico de OS (GLPI style) */}
              {drawerTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                        Histórico de Manutenções & Ordens de Serviço
                      </h4>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Todas as intervenções técnicas realizadas neste equipamento.
                      </span>
                    </div>
                    <Link
                      href="/dashboard/chamados"
                      style={{
                        background: '#2563eb',
                        color: '#fff',
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
                      Abrir OS para este Ativo
                    </Link>
                  </div>

                  {selectedDevice.maintenanceHistory.length === 0 ? (
                    <div style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                      <i className="ti ti-circle-check" style={{ fontSize: '32px', display: 'block', marginBottom: '8px', color: '#16a34a' }} />
                      <strong style={{ display: 'block', fontSize: '13px', color: '#334155' }}>Nenhum chamado corretivo registrado</strong>
                      <span style={{ fontSize: '11px' }}>Este equipamento está saudável e não precisou de reparos até agora.</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {selectedDevice.maintenanceHistory.map((m) => (
                        <div
                          key={m.id}
                          style={{
                            padding: '14px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#ffffff',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, fontSize: '11px', color: '#2563eb' }}>{m.ticketCode}</span>
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: m.type === 'Preventiva' ? '#dcfce7' : m.type === 'Upgrade' ? '#f3e8ff' : '#fee2e2',
                                  color: m.type === 'Preventiva' ? '#15803d' : m.type === 'Upgrade' ? '#7e22ce' : '#b91c1c'
                                }}
                              >
                                {m.type}
                              </span>
                            </div>
                            <span style={{ fontSize: '10px', color: '#94a3b8' }}>{m.date}</span>
                          </div>
                          <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#334155', lineHeight: 1.5 }}>
                            {m.description}
                          </p>
                          <span style={{ fontSize: '10px', color: '#64748b' }}>
                            Técnico executor: <b>{m.technician}</b>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Aba Garantia e Vínculo */}
              {drawerTab === 'contract' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                      Garantia e Ciclo de Vida
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '12px' }}>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Data de Aquisição</span>
                        <span style={{ color: '#0f172a' }}>{selectedDevice.acquisitionDate || 'Não informada'}</span>
                      </div>
                      <div>
                        <span style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', display: 'block' }}>Vigência da Garantia</span>
                        <strong style={{ color: '#0f172a' }}>{selectedDevice.warrantyExpire || 'Sem garantia ativa'}</strong>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                      Vínculo Organizacional
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#2563eb', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800 }}>
                        <i className="ti ti-building" />
                      </div>
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>{selectedDevice.companyName}</strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Setor: {selectedDevice.department} • Responsável: {selectedDevice.assignedUser}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="nesher-drawer-footer">
              <Link
                href={`/dashboard/chamados?assetTag=${selectedDevice.tag}`}
                style={{
                  background: '#2563eb',
                  color: '#ffffff',
                  padding: '8px 14px',
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
                Abrir Chamado / OS para este Ativo
              </Link>
              <button
                type="button"
                className="nesher-primary-button"
                onClick={() => setSelectedDevice(null)}
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Novo Equipamento */}
      {isCreateModalOpen && (
        <div className="nesher-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="nesher-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="nesher-modal-header">
              <h2>Cadastrar Novo Ativo de TI (GLPI)</h2>
              <button type="button" className="nesher-modal-close" onClick={() => setIsCreateModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateDevice}>
              <div className="nesher-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Nº de Patrimônio (Tag) *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: PAT-0150"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Número de Série (S/N)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: SN-DELL-88129"
                      value={newSerial}
                      onChange={(e) => setNewSerial(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Tipo de Ativo
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as DeviceType)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                    >
                      <option value="Notebook">Notebook / Laptop</option>
                      <option value="Desktop">Desktop / Computador</option>
                      <option value="Servidor">Servidor / Storage</option>
                      <option value="Impressora">Impressora / Térmica</option>
                      <option value="Rede / Switch">Switch / Roteador / Rede</option>
                      <option value="Periférico">Periférico / Outro</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Fabricante / Marca
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Dell, Lenovo, HP, Cisco"
                      value={newBrand}
                      onChange={(e) => setNewBrand(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Modelo Exato *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: ThinkPad T14 Gen 3 ou PowerEdge R740"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Empresa Alocada
                    </label>
                    <select
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                    >
                      {availableCompanies.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Usuário / Responsável
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Carlos Mendes ou Sala de Servidores"
                      value={newUser}
                      onChange={(e) => setNewUser(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Processador (CPU)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Core i7 12ª Ger ou Xeon"
                      value={newCpu}
                      onChange={(e) => setNewCpu(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Memória RAM
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 16 GB DDR4"
                      value={newRam}
                      onChange={(e) => setNewRam(e.target.value)}
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
                  Cadastrar no Inventário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
