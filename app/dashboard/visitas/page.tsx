'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';

export type VisitStatus = 'Agendada' | 'A Caminho' | 'Em Atendimento' | 'Concluída' | 'Cancelada';

export interface RemoteSession {
  id: string;
  code: string;
  companyName: string;
  requester: string;
  technician: string;
  startTime: string;
  duration: string;
  status: 'Ativa' | 'Encerrada';
  notes: string;
}

export interface VisitChecklistItem {
  id: string;
  task: string;
  completed: boolean;
}

export interface TechnicalVisit {
  id: string;
  code: string;
  companyName: string;
  address: string;
  city: string;
  state: string;
  contactName: string;
  contactPhone: string;
  ticketCode: string;
  ticketSubject: string;
  scheduledDate: string;
  scheduledTime: string;
  technicianName: string;
  technicianInitials: string;
  status: VisitStatus;
  checklist: VisitChecklistItem[];
  technicalReport?: string;
  clientSignature?: string; // Data URL or text confirmation
  signatureDate?: string;
}

const initialVisits: TechnicalVisit[] = [];
const initialRemoteSessions: RemoteSession[] = [];

export default function VisitasPage() {
  const [visits, setVisits] = useState<TechnicalVisit[]>([]);
  const [remoteSessions, setRemoteSessions] = useState<RemoteSession[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'visitas' | 'remoto'>('visitas');
  const [statusFilter, setStatusFilter] = useState<'Todas' | VisitStatus>('Todas');
  const [search, setSearch] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<TechnicalVisit | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isRemoteModalOpen, setIsRemoteModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Remote Session State
  const [remoteClientName, setRemoteClientName] = useState('');
  const [remoteCompanyName, setRemoteCompanyName] = useState('');
  const [generatedRemoteCode, setGeneratedRemoteCode] = useState('NESH-8942');

  // New Visit Form States
  const [newVisitCompany, setNewVisitCompany] = useState('');
  const [newVisitAddress, setNewVisitAddress] = useState('');
  const [newVisitContact, setNewVisitContact] = useState('');
  const [newVisitPhone, setNewVisitPhone] = useState('');
  const [newVisitSubject, setNewVisitSubject] = useState('');
  const [newVisitDate, setNewVisitDate] = useState('Amanhã');
  const [newVisitTime, setNewVisitTime] = useState('09:00 - 11:30');
  const [newVisitTech, setNewVisitTech] = useState('Rafael Souza');

  // Signature canvas simulation
  const [signatureName, setSignatureName] = useState('');
  const [signatureDone, setSignatureDone] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const storedVisits = localStorage.getItem('nesher_visits');
      if (storedVisits) {
        const parsed = JSON.parse(storedVisits);
        if (Array.isArray(parsed)) {
          const clean = parsed.filter(
            (v: TechnicalVisit) =>
              !['Acme Indústria de Componentes', 'Hospital e Clínica Santa Helena', 'TechFin Soluções Digitais', 'Construtora Vanguarda'].includes(v.companyName)
          );
          setVisits(clean);
        }
      } else {
        localStorage.setItem('nesher_visits', JSON.stringify([]));
      }

      const storedRemote = localStorage.getItem('nesher_remote_sessions');
      if (storedRemote) {
        const parsedRemote = JSON.parse(storedRemote);
        if (Array.isArray(parsedRemote)) {
          const cleanRemote = parsedRemote.filter(
            (r: RemoteSession) =>
              !['Acme Indústria de Componentes', 'Construtora Vanguarda', 'Acme Corporation'].includes(r.companyName)
          );
          setRemoteSessions(cleanRemote);
        }
      } else {
        localStorage.setItem('nesher_remote_sessions', JSON.stringify([]));
      }

      const storedCompanies = localStorage.getItem('nesher_companies');
      if (storedCompanies) {
        const parsedComp = JSON.parse(storedCompanies);
        if (Array.isArray(parsedComp)) {
          const names = parsedComp
            .map((c: any) => c.tradeName || c.legalName)
            .filter(Boolean);
          setAvailableCompanies(names);
          if (names.length > 0) {
            setNewVisitCompany(names[0]);
            setRemoteCompanyName(names[0]);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const persistVisits = (updated: TechnicalVisit[]) => {
    setVisits(updated);
    try {
      localStorage.setItem('nesher_visits', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const persistRemoteSessions = (updated: RemoteSession[]) => {
    setRemoteSessions(updated);
    try {
      localStorage.setItem('nesher_remote_sessions', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredVisits = useMemo(() => {
    return visits.filter((v) => {
      const matchSearch =
        v.companyName.toLowerCase().includes(search.toLowerCase()) ||
        v.ticketCode.toLowerCase().includes(search.toLowerCase()) ||
        v.technicianName.toLowerCase().includes(search.toLowerCase()) ||
        v.address.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === 'Todas' ? true : v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [visits, search, statusFilter]);

  const handleToggleChecklist = (visitId: string, itemId: string) => {
    const updated = visits.map((v) => {
      if (v.id === visitId) {
        const updatedList = v.checklist.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        return { ...v, checklist: updatedList };
      }
      return v;
    });

    persistVisits(updated);

    if (selectedVisit && selectedVisit.id === visitId) {
      setSelectedVisit((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          checklist: prev.checklist.map((item) =>
            item.id === itemId ? { ...item, completed: !item.completed } : item
          )
        };
      });
    }
  };

  const handleConfirmSignature = (visitId: string) => {
    if (!signatureName) {
      alert('Informe o nome do responsável pelo aceite do serviço.');
      return;
    }

    const updated = visits.map((v) => {
      if (v.id === visitId) {
        return {
          ...v,
          status: 'Concluída' as VisitStatus,
          clientSignature: `${signatureName} (Confirmado digitalmente)`,
          signatureDate: 'Agora'
        };
      }
      return v;
    });

    persistVisits(updated);
    if (selectedVisit && selectedVisit.id === visitId) {
      setSelectedVisit((prev) =>
        prev
          ? {
              ...prev,
              status: 'Concluída',
              clientSignature: `${signatureName} (Confirmado digitalmente)`,
              signatureDate: 'Agora'
            }
          : null
      );
    }
    setSignatureDone(true);
    showToast('Ordem de serviço assinada e finalizada com sucesso!');
  };

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalCompany = newVisitCompany.trim() || 'Empresa Padrão';
    if (!newVisitSubject || !newVisitAddress) {
      alert('Preencha o motivo e o endereço da visita.');
      return;
    }

    const initials = newVisitTech
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2);

    const newV: TechnicalVisit = {
      id: `vis-${Date.now()}`,
      code: `VIS-${Math.floor(1000 + Math.random() * 9000)}`,
      companyName: finalCompany,
      address: newVisitAddress,
      city: 'São Paulo',
      state: 'SP',
      contactName: newVisitContact || 'Gestor Local',
      contactPhone: newVisitPhone || '(11) 3000-0000',
      ticketCode: `#NS-${Math.floor(1000 + Math.random() * 50)}`,
      ticketSubject: newVisitSubject,
      scheduledDate: newVisitDate,
      scheduledTime: newVisitTime,
      technicianName: newVisitTech,
      technicianInitials: initials,
      status: 'Agendada',
      checklist: [
        { id: 'c-init', task: 'Check-in e validação de segurança no local', completed: false },
        { id: 'c-exec', task: 'Execução do procedimento técnico conforme chamado', completed: false },
        { id: 'c-sign', task: 'Coleta de assinatura digital do cliente', completed: false }
      ],
      technicalReport: 'Visita técnica agendada pelo NOC Nesher.'
    };

    persistVisits([newV, ...visits]);
    setIsScheduleModalOpen(false);
    showToast(`Visita ${newV.code} agendada para ${newVisitTech}!`);

    // Reset
    setNewVisitSubject('');
    setNewVisitAddress('');
    setNewVisitContact('');
    setNewVisitPhone('');
  };

  const handleGenerateRemoteSession = () => {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const newCode = `NESH-${randomDigits}`;
    setGeneratedRemoteCode(newCode);

    const finalCompany = remoteCompanyName.trim() || 'Empresa Padrão';

    const newSession: RemoteSession = {
      id: `rem-${Date.now()}`,
      code: newCode,
      companyName: finalCompany,
      requester: remoteClientName || 'Solicitante Remoto',
      technician: 'Marina Costa',
      startTime: 'Agora',
      duration: 'Iniciando...',
      status: 'Ativa',
      notes: 'Sessão remota assistida iniciada sob demanda.'
    };

    persistRemoteSessions([newSession, ...remoteSessions]);
    showToast(`Código de sessão remota ${newCode} gerado!`);
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
          <p className="nesher-eyebrow">AUVO & FIELD SERVICE • ATENDIMENTO EM CAMPO</p>
          <h1>Visitas Técnicas & Atendimento Remoto</h1>
          <p>
            Gerencie o suporte presencial dos técnicos de campo, rotas com integração a GPS,
            checklists de atendimento, assinatura digital e sessões remotas imediatas.
          </p>
        </div>
        <div className="nesher-page-header-actions">
          <button
            type="button"
            className="nesher-select"
            style={{ padding: '8px 14px', fontSize: '11px', fontWeight: 700, color: '#1e40af', background: '#eff6ff', borderColor: '#bfdbfe' }}
            onClick={() => setIsRemoteModalOpen(true)}
          >
            <i className="ti ti-access-point" style={{ fontSize: '16px' }} />
            <span>Sessão Remota Imediata</span>
          </button>
          <button
            type="button"
            className="nesher-primary-button"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <i className="ti ti-calendar-plus" />
            <span>Agendar Visita Técnica</span>
          </button>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="nesher-tab-bar" style={{ marginBottom: '20px' }}>
        <button
          type="button"
          className={`nesher-tab-btn ${activeTab === 'visitas' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('visitas')}
          style={{ fontSize: '13px' }}
        >
          <i className="ti ti-calendar-event" />
          <span>Agenda de Campo & Visitas ({visits.length})</span>
        </button>
        <button
          type="button"
          className={`nesher-tab-btn ${activeTab === 'remoto' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('remoto')}
          style={{ fontSize: '13px' }}
        >
          <i className="ti ti-cast" />
          <span>Sessões Remotas Ativas ({remoteSessions.filter((r) => r.status === 'Ativa').length})</span>
        </button>
      </div>

      {activeTab === 'visitas' && (
        <>
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
                  placeholder="Buscar por Empresa, Técnico, OS ou Endereço..."
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Status:</span>
                {(['Todas', 'Agendada', 'A Caminho', 'Em Atendimento', 'Concluída'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatusFilter(s)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: statusFilter === s ? '#2563eb' : '#e2e8f0',
                      background: statusFilter === s ? '#eff6ff' : '#ffffff',
                      color: statusFilter === s ? '#1d4ed8' : '#64748b'
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Visits Table */}
          <div className="nesher-panel" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 18px', fontWeight: 700 }}>Código & Horário</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Empresa & Endereço</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Chamado / Motivo</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Técnico Designado</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Progresso Checklist</th>
                    <th style={{ padding: '12px 14px', fontWeight: 700 }}>Status</th>
                    <th style={{ padding: '12px 18px', fontWeight: 700, textAlign: 'right' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '56px 16px', textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#64748b', fontSize: 28 }}>
                            <i className="ti ti-calendar-event" />
                          </div>
                          <strong style={{ display: 'block', fontSize: '15px', color: '#1e293b', marginBottom: '6px' }}>
                            {visits.length === 0 ? 'Nenhuma visita agendada (Base Zerada)' : 'Nenhuma visita encontrada'}
                          </strong>
                          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b', maxWidth: 420 }}>
                            {visits.length === 0
                              ? 'A agenda de campo está vazia e pronta para os primeiros atendimentos presenciais.'
                              : 'Tente alterar os filtros de busca para encontrar o agendamento desejado.'}
                          </p>
                          {visits.length === 0 && (
                            <button
                              type="button"
                              className="nesher-primary-button"
                              onClick={() => setIsScheduleModalOpen(true)}
                            >
                              <i className="ti ti-calendar-plus" />
                              <span>+ Agendar Primeira Visita</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredVisits.map((visit) => {
                      const completedCount = visit.checklist.filter((c) => c.completed).length;
                      const totalCount = visit.checklist.length;
                      const progressPct = Math.round((completedCount / totalCount) * 100);

                      return (
                        <tr
                          key={visit.id}
                          onClick={() => setSelectedVisit(visit)}
                          style={{
                            borderBottom: '1px solid #f1f5f9',
                            cursor: 'pointer',
                            transition: 'background 0.12s ease'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          {/* Código & Horário */}
                          <td style={{ padding: '14px 18px' }}>
                            <strong style={{ display: 'block', fontSize: '13px', color: '#1e40af' }}>
                              {visit.code}
                            </strong>
                            <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>
                              {visit.scheduledDate} • {visit.scheduledTime}
                            </span>
                          </td>

                          {/* Empresa & Endereço */}
                          <td style={{ padding: '14px 14px' }}>
                            <strong style={{ display: 'block', fontSize: '12px', color: '#0f172a' }}>
                              {visit.companyName}
                            </strong>
                            <span style={{ fontSize: '11px', color: '#64748b' }}>
                              {visit.address}, {visit.city}
                            </span>
                          </td>

                          {/* Chamado / Motivo */}
                          <td style={{ padding: '14px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 800, color: '#2563eb' }}>{visit.ticketCode}</span>
                              <span style={{ fontSize: '11px', color: '#0f172a', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {visit.ticketSubject}
                              </span>
                            </div>
                            <span style={{ fontSize: '10px', color: '#64748b' }}>
                              Contato: {visit.contactName} ({visit.contactPhone})
                            </span>
                          </td>

                          {/* Técnico */}
                          <td style={{ padding: '14px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  borderRadius: '50%',
                                  background: '#dbeafe',
                                  color: '#1d4ed8',
                                  display: 'grid',
                                  placeItems: 'center',
                                  fontSize: '10px',
                                  fontWeight: 800
                                }}
                              >
                                {visit.technicianInitials}
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                                {visit.technicianName}
                              </span>
                            </div>
                          </td>

                          {/* Checklist */}
                          <td style={{ padding: '14px 14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ flex: 1, background: '#e2e8f0', borderRadius: '4px', height: '6px', minWidth: '60px', overflow: 'hidden' }}>
                                <div style={{ background: progressPct === 100 ? '#16a34a' : '#2563eb', width: `${progressPct}%`, height: '100%' }} />
                              </div>
                              <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
                                {completedCount}/{totalCount}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 14px' }}>
                            <span
                              className={`nesher-badge ${
                                visit.status === 'Concluída'
                                  ? 'aprovada'
                                  : visit.status === 'Em Atendimento'
                                  ? 'operacional'
                                  : visit.status === 'A Caminho'
                                  ? 'alerta'
                                  : 'prata'
                              }`}
                            >
                              <i
                                className={
                                  visit.status === 'Concluída'
                                    ? 'ti ti-check'
                                    : visit.status === 'Em Atendimento'
                                    ? 'ti ti-tool'
                                    : visit.status === 'A Caminho'
                                    ? 'ti ti-car'
                                    : 'ti ti-clock'
                                }
                              />
                              {visit.status}
                            </span>
                          </td>

                          {/* Ações */}
                          <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedVisit(visit);
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
                              <i className="ti ti-clipboard-list" />
                              Executar OS
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
        </>
      )}

      {/* Tab: Sessões Remotas */}
      {activeTab === 'remoto' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Quick Remote Banner */}
          <div className="nesher-remote-code-box">
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>
              Central de Acesso Remoto Imediato
            </h3>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#93c5fd', maxWidth: '580px' }}>
              Passe este código de segurança ao cliente da empresa para autorizar a conexão direta do técnico Nesher.
            </p>
            <div className="nesher-remote-code-digits">{generatedRemoteCode}</div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(generatedRemoteCode);
                  showToast('Código copiado para a área de transferência!');
                }}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 0,
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="ti ti-copy" />
                Copiar Código
              </button>
              <button
                type="button"
                onClick={handleGenerateRemoteSession}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '9px 16px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="ti ti-refresh" />
                Gerar Novo Código
              </button>
            </div>
          </div>

          {/* Sessions List */}
          <div className="nesher-panel" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                Histórico de Conexões Remotas
              </h3>
            </div>
            <div style={{ padding: '12px' }}>
              {remoteSessions.length === 0 ? (
                <div style={{ padding: '48px 16px', textAlign: 'center', color: '#94a3b8' }}>
                  <i className="ti ti-access-point-off" style={{ fontSize: '36px', display: 'block', marginBottom: '10px', opacity: 0.5 }} />
                  <strong style={{ display: 'block', fontSize: '14px', color: '#475569', marginBottom: '4px' }}>Nenhuma sessão remota registrada (Base Zerada)</strong>
                  <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Gere um novo código acima para iniciar um suporte remoto com um cliente.</p>
                </div>
              ) : (
                remoteSessions.map((session) => (
                  <div
                    key={session.id}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: '#ffffff',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontWeight: 800,
                          fontSize: '14px',
                          color: '#1d4ed8',
                          background: '#eff6ff',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: '1px solid #bfdbfe'
                        }}
                      >
                        {session.code}
                      </span>
                      <div>
                        <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a' }}>
                          {session.companyName} • {session.requester}
                        </strong>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          Técnico: {session.technician} • Início: {session.startTime} • Duração: {session.duration}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        className={`nesher-badge ${session.status === 'Ativa' ? 'operacional' : 'prata'}`}
                      >
                        <i className={`ti ti-${session.status === 'Ativa' ? 'wifi' : 'check'}`} />
                        {session.status}
                      </span>
                      {session.status === 'Ativa' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = remoteSessions.map((r) =>
                              r.id === session.id
                                ? { ...r, status: 'Encerrada' as const, duration: 'Finalizada' }
                                : r
                            );
                            persistRemoteSessions(updated);
                            showToast('Sessão remota encerrada.');
                          }}
                          style={{
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: '1px solid #fca5a5',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Encerrar
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drawer: Execução de Visita & Assinatura Digital (Auvo Style) */}
      {selectedVisit && (
        <div className="nesher-drawer-overlay" onClick={() => setSelectedVisit(null)}>
          <div className="nesher-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="nesher-drawer-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '13px', color: '#1e40af', background: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>
                    {selectedVisit.code}
                  </span>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    Ordem de Visita em Campo
                  </h3>
                </div>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  {selectedVisit.companyName} • Técnico: <b>{selectedVisit.technicianName}</b>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVisit(null)}
                style={{ background: 'none', border: 0, color: '#94a3b8', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div className="nesher-drawer-body">
              {/* Localização e Rota */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px', fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase' }}>
                      Localização do Atendimento
                    </h4>
                    <p style={{ margin: 0, fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>
                      {selectedVisit.address}
                    </p>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {selectedVisit.city} - {selectedVisit.state} • Contato: {selectedVisit.contactName} ({selectedVisit.contactPhone})
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedVisit.address}, ${selectedVisit.city}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#2563eb',
                      color: '#ffffff',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <i className="ti ti-map-pin" />
                    Abrir no GPS
                  </a>
                </div>
              </div>

              {/* Chamado Associado */}
              <div style={{ background: '#eff6ff', padding: '14px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <span style={{ fontSize: '10px', fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase' }}>
                  Chamado Vinculado {selectedVisit.ticketCode}
                </span>
                <strong style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginTop: '2px' }}>
                  {selectedVisit.ticketSubject}
                </strong>
              </div>

              {/* Checklist de Atividades no Local */}
              <div>
                <h4 style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Checklist de Campo (Auvo Style)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedVisit.checklist.map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '7px',
                        border: '1px solid',
                        borderColor: item.completed ? '#bbf7d0' : '#e2e8f0',
                        background: item.completed ? '#f0fdf4' : '#ffffff',
                        cursor: 'pointer',
                        fontSize: '12px',
                        color: item.completed ? '#166534' : '#334155'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => handleToggleChecklist(selectedVisit.id, item.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <span style={{ textDecoration: item.completed ? 'line-through' : 'none' }}>
                        {item.task}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Laudo do Técnico */}
              <div>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Laudo Técnico da Intervenção
                </h4>
                <textarea
                  rows={3}
                  defaultValue={selectedVisit.technicalReport}
                  placeholder="Descreva as ações realizadas no equipamento, peças substituídas ou recomendações..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '12px',
                    outline: 'none',
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Assinatura Digital do Cliente */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  Assinatura Digital & Aceite do Cliente
                </h4>
                {selectedVisit.clientSignature ? (
                  <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#16a34a', fontWeight: 700, fontSize: '12px' }}>
                      <i className="ti ti-certificate" style={{ fontSize: '18px' }} />
                      <span>{selectedVisit.clientSignature}</span>
                    </div>
                    <small style={{ color: '#64748b', display: 'block', marginTop: '4px' }}>
                      Registrado em: {selectedVisit.signatureDate}
                    </small>
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#64748b' }}>
                      O gestor da empresa deve assinar ou confirmar o nome para encerramento da visita técnica no local.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Nome completo do responsável (ex: Carlos Mendes)"
                        value={signatureName}
                        onChange={(e) => setSignatureName(e.target.value)}
                        style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleConfirmSignature(selectedVisit.id)}
                        style={{
                          background: '#16a34a',
                          color: '#fff',
                          border: 0,
                          padding: '8px 14px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <i className="ti ti-writing-sign" />
                        Coletar Assinatura
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="nesher-drawer-footer">
              <button
                type="button"
                className="nesher-primary-button"
                onClick={() => setSelectedVisit(null)}
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Agendar Visita */}
      {isScheduleModalOpen && (
        <div className="nesher-modal-overlay" onClick={() => setIsScheduleModalOpen(false)}>
          <div className="nesher-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="nesher-modal-header">
              <h2>Agendar Nova Visita Técnica (Field Service)</h2>
              <button type="button" className="nesher-modal-close" onClick={() => setIsScheduleModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateVisit}>
              <div className="nesher-modal-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Empresa Cliente *
                    </label>
                    {availableCompanies.length > 0 ? (
                      <select
                        value={newVisitCompany}
                        onChange={(e) => setNewVisitCompany(e.target.value)}
                        required
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                      >
                        {availableCompanies.map((cName) => (
                          <option key={cName} value={cName}>{cName}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Nome da empresa cliente"
                        required
                        value={newVisitCompany}
                        onChange={(e) => setNewVisitCompany(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Técnico de Campo
                    </label>
                    <select
                      value={newVisitTech}
                      onChange={(e) => setNewVisitTech(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                    >
                      <option value="Rafael Souza">Rafael Souza (Especialista Hardware/Redes)</option>
                      <option value="Marina Costa">Marina Costa (NOC & Infraestrutura)</option>
                      <option value="Lucas Silva">Lucas Silva (Sistemas & Bancada)</option>
                      <option value="Diego Martins">Diego Martins (Periféricos & Impressoras)</option>
                    </select>
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Motivo da Visita / Procedimento *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Troca de SSD e reinstalação de sistema na diretoria"
                      value={newVisitSubject}
                      onChange={(e) => setNewVisitSubject(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Endereço Completo do Local *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Rua, Número, Bairro, Cidade e Ponto de Referência"
                      value={newVisitAddress}
                      onChange={(e) => setNewVisitAddress(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Data Prevista
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Hoje ou 15/09/2026"
                      value={newVisitDate}
                      onChange={(e) => setNewVisitDate(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                      Horário Estimado
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 14:00 - 16:30"
                      value={newVisitTime}
                      onChange={(e) => setNewVisitTime(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                    />
                  </div>
                </div>
              </div>

              <div className="nesher-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  style={{ background: '#f1f5f9', color: '#475569', border: 0, padding: '9px 16px', borderRadius: '7px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button type="submit" className="nesher-primary-button">
                  Confirmar Agendamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sessão Remota Imediata */}
      {isRemoteModalOpen && (
        <div className="nesher-modal-overlay" onClick={() => setIsRemoteModalOpen(false)}>
          <div className="nesher-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="nesher-modal-header">
              <h2>Sessão de Suporte Remoto</h2>
              <button type="button" className="nesher-modal-close" onClick={() => setIsRemoteModalOpen(false)}>✕</button>
            </div>

            <div className="nesher-modal-body">
              <div className="nesher-remote-code-box" style={{ padding: '20px' }}>
                <small style={{ color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Código de Conexão Seguro
                </small>
                <div className="nesher-remote-code-digits" style={{ fontSize: '32px' }}>
                  {generatedRemoteCode}
                </div>
                <span style={{ fontSize: '11px', color: '#bfdbfe' }}>
                  Informe este código ao usuário da empresa cliente.
                </span>
              </div>

              <div style={{ marginTop: '14px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Nome do Solicitante
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos Mendes"
                  value={remoteClientName}
                  onChange={(e) => setRemoteClientName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                />
              </div>

              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#334155', marginBottom: '5px' }}>
                  Empresa Cliente
                </label>
                {availableCompanies.length > 0 ? (
                  <select
                    value={remoteCompanyName}
                    onChange={(e) => setRemoteCompanyName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px', background: '#fff' }}
                  >
                    {availableCompanies.map((cName) => (
                      <option key={cName} value={cName}>{cName}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Nome da empresa cliente"
                    value={remoteCompanyName}
                    onChange={(e) => setRemoteCompanyName(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '7px', border: '1px solid #cbd5e1', fontSize: '12px' }}
                  />
                )}
              </div>
            </div>

            <div className="nesher-modal-footer">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(generatedRemoteCode);
                  showToast('Código de sessão copiado!');
                  setIsRemoteModalOpen(false);
                }}
                style={{
                  background: '#2563eb',
                  color: '#fff',
                  border: 0,
                  padding: '9px 16px',
                  borderRadius: '7px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Copiar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
