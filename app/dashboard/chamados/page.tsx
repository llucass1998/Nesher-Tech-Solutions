'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  Priority,
  TicketStatus,
  ServiceType,
  Message,
  ChecklistItem,
  AssetInfo,
  Observer,
  CSATRating,
  Ticket,
} from './types';
import { serviceQueues, getQueueById, createSystemLog } from './queues';

const categoryOptions = [
  'Todas',
  'Infraestrutura',
  'Redes',
  'Hardware',
  'Software',
  'Segurança',
  'Acessos',
];

const priorityOptions: ('Todas' | Priority)[] = ['Todas', 'Urgente', 'Alta', 'Média', 'Baixa'];
const typeOptions: ('Todos' | ServiceType)[] = ['Todos', 'Remoto', 'Campo', 'Laboratório'];

export default function TicketCenterPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [registeredCompanies, setRegisteredCompanies] = useState<string[]>([]);

  // Modals & Panels
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isTriageModalOpen, setIsTriageModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isObserverModalOpen, setIsObserverModalOpen] = useState(false);
  const [isCsatModalOpen, setIsCsatModalOpen] = useState(false);
  const [isReopenModalOpen, setIsReopenModalOpen] = useState(false);
  const [isRemoteSessionModalOpen, setIsRemoteSessionModalOpen] = useState(false);
  const [isFieldVisitModalOpen, setIsFieldVisitModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isClientConfirmModalOpen, setIsClientConfirmModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Hydrate tickets from localStorage with USPDev Queues migration
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nesher_tickets');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Filter out legacy mock tickets & migrate to Queues
          const clean = parsed
            .filter(
              (t: Ticket) =>
                ![
                  'Acme Corporation',
                  'Clínica São Lucas',
                  'Mercado Central',
                  'Grupo Horizonte',
                  'Logística Express',
                  'Distribuidora Alfa',
                  'Metalúrgica Imperial',
                  'Comercial São Jorge',
                  'Studio Norte',
                ].includes(t.company)
            )
            .map((t: any) => {
              const defaultQueue =
                serviceQueues.find((q) => q.id === t.queueId) ||
                serviceQueues[0];
              return {
                ...t,
                queueId: t.queueId || defaultQueue.id,
                queueName: t.queueName || defaultQueue.name,
                observers: t.observers || [],
                messages: (t.messages || []).map((m: any) => ({
                  ...m,
                  type: m.type || 'support',
                })),
              } as Ticket;
            });

          setTickets(clean);
          if (clean.length > 0) {
            setSelectedTicketId(clean[0].id);
          }
          return;
        }
      }
      setTickets([]);
      localStorage.setItem('nesher_tickets', JSON.stringify([]));
    } catch {
      setTickets([]);
    }
  }, []);

  // Hydrate registered companies from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('nesher_companies');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const names = parsed
            .map((c: any) => c.tradeName || c.legalName)
            .filter(Boolean);
          setRegisteredCompanies(names);
          if (names.length > 0) {
            setNewCompany(names[0]);
          }
        }
      }
    } catch {}
  }, []);

  const persistTickets = (updated: Ticket[]) => {
    setTickets(updated);
    try {
      localStorage.setItem('nesher_tickets', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  // View Mode: Table (default with pagination) vs Kanban vs Split
  const [viewMode, setViewMode] = useState<'table' | 'kanban' | 'split'>('table');

  // Filters and Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuickTab, setActiveQuickTab] = useState<string>('todos');
  const [selectedQueue, setSelectedQueue] = useState<string>('Todas');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedPriority, setSelectedPriority] = useState('Todas');
  const [selectedType, setSelectedType] = useState<'Todos' | ServiceType>('Todos');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sorting
  const [sortBy, setSortBy] = useState<'code' | 'priority' | 'status' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Composer within Drawer/Split
  const [composerText, setComposerText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  // New Ticket Form State
  const [newSubject, setNewSubject] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newRequester, setNewRequester] = useState('');
  const [newQueueId, setNewQueueId] = useState('queue-n1');
  const [newCategory, setNewCategory] = useState('Infraestrutura');
  const [newPriority, setNewPriority] = useState<Priority>('Alta');
  const [newServiceType, setNewServiceType] = useState<ServiceType>('Campo');
  const [newAssetTag, setNewAssetTag] = useState('');
  const [newAssetBrand, setNewAssetBrand] = useState('');
  const [newAssetModel, setNewAssetModel] = useState('');
  const [newAssetSerial, setNewAssetSerial] = useState('');
  const [newObserverEmail, setNewObserverEmail] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Triage Homologation Modal State
  const [triagePriority, setTriagePriority] = useState<Priority>('Alta');
  const [triageTechnician, setTriageTechnician] = useState('Rafael Lima');

  // Transfer Queue Modal State
  const [transferTargetQueueId, setTransferTargetQueueId] = useState('queue-n2-net');
  const [transferReason, setTransferReason] = useState('');

  // Observer Modal State
  const [observerNameInput, setObserverNameInput] = useState('');
  const [observerEmailInput, setObserverEmailInput] = useState('');

  // CSAT Rating Modal State
  const [csatScoreInput, setCsatScoreInput] = useState(5);
  const [csatCommentInput, setCsatCommentInput] = useState('');

  // Reopen Modal State
  const [reopenReasonInput, setReopenReasonInput] = useState('');

  // Protocol Decision Form States (Flowchart: Remote vs Presential)
  const [remoteTool, setRemoteTool] = useState<'RustDesk' | 'AnyDesk' | 'TeamViewer' | 'QuickAssist'>('RustDesk');
  const [remoteSessionCode, setRemoteSessionCode] = useState('NESH-8942');
  const [fieldTech, setFieldTech] = useState('Lucas Silva');
  const [fieldDate, setFieldDate] = useState('Amanhã');
  const [fieldTime, setFieldTime] = useState('09:00 - 11:30');
  const [fieldAddress, setFieldAddress] = useState('');
  const [reportDiagnostic, setReportDiagnostic] = useState('');
  const [reportSolution, setReportSolution] = useState('');
  const [reportRecommendations, setReportRecommendations] = useState('');
  const [confirmClientName, setConfirmClientName] = useState('');
  const [confirmMethod, setConfirmMethod] = useState<'Digital' | 'Assinatura Presencial' | 'Portal do Cliente'>('Portal do Cliente');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesQuery =
          ticket.code.toLowerCase().includes(q) ||
          ticket.subject.toLowerCase().includes(q) ||
          ticket.company.toLowerCase().includes(q) ||
          ticket.requester.toLowerCase().includes(q) ||
          ticket.technician.toLowerCase().includes(q) ||
          ticket.queueName.toLowerCase().includes(q) ||
          (ticket.asset &&
            `${ticket.asset.tag || ''} ${ticket.asset.brand} ${ticket.asset.model} ${ticket.asset.serial}`
              .toLowerCase()
              .includes(q));
        if (!matchesQuery) return false;
      }

      // Quick Tabs
      if (activeQuickTab === 'triagem') {
        if (ticket.status !== 'Em Triagem') return false;
      } else if (activeQuickTab === 'meus') {
        if (ticket.technician !== 'Rafael Lima') return false;
      } else if (activeQuickTab === 'nao_atribuidos') {
        if (ticket.technician !== 'Não Atribuído') return false;
      } else if (activeQuickTab === 'urgentes') {
        if (ticket.priority !== 'Urgente' && ticket.priority !== 'Alta') return false;
      } else if (activeQuickTab === 'atendimento') {
        if (ticket.status !== 'Em Atendimento') return false;
      } else if (activeQuickTab === 'aguardando') {
        if (
          ticket.status !== 'Aguardando Cliente' &&
          ticket.status !== 'Aguardando Peças'
        )
          return false;
      } else if (activeQuickTab === 'resolvidos') {
        if (ticket.status !== 'Resolvido' && ticket.status !== 'Fechado') return false;
      }

      // Filter: Fila de Atendimento (Queue)
      if (selectedQueue !== 'Todas' && ticket.queueId !== selectedQueue) return false;

      // Select Dropdowns
      if (selectedCategory !== 'Todas' && ticket.category !== selectedCategory) return false;
      if (selectedPriority !== 'Todas' && ticket.priority !== selectedPriority) return false;
      if (selectedType !== 'Todos' && ticket.serviceType !== selectedType) return false;

      return true;
    });
  }, [
    tickets,
    searchQuery,
    activeQuickTab,
    selectedQueue,
    selectedCategory,
    selectedPriority,
    selectedType,
  ]);

  // Sorted Tickets
  const sortedTickets = useMemo(() => {
    return [...filteredTickets].sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'priority') {
        const weights: Record<Priority, number> = { Urgente: 4, Alta: 3, Média: 2, Baixa: 1 };
        valA = weights[a.priority];
        valB = weights[b.priority];
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTickets, sortBy, sortOrder]);

  // Paginated Tickets
  const totalPages = Math.max(1, Math.ceil(sortedTickets.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTickets = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return sortedTickets.slice(start, start + pageSize);
  }, [sortedTickets, safeCurrentPage, pageSize]);

  // Selected ticket
  const selectedTicket = useMemo(() => {
    if (!tickets.length) return null;
    return tickets.find((t) => t.id === selectedTicketId) || tickets[0] || null;
  }, [tickets, selectedTicketId]);

  // KPI Metrics calculation
  const kpiMetrics = useMemo(() => {
    const total = tickets.length;
    const triagem = tickets.filter((t) => t.status === 'Em Triagem').length;
    const novos = tickets.filter((t) => t.status === 'Novo').length;
    const atendimento = tickets.filter((t) => t.status === 'Em Atendimento').length;
    const slaRisco = tickets.filter(
      (t) => t.slaStatus === 'breached' || t.slaStatus === 'warning'
    ).length;
    const resolvidos = tickets.filter(
      (t) => t.status === 'Resolvido' || t.status === 'Fechado'
    ).length;
    return { total, triagem, novos, atendimento, slaRisco, resolvidos };
  }, [tickets]);

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setActiveQuickTab('todos');
    setSelectedQueue('Todas');
    setSelectedCategory('Todas');
    setSelectedPriority('Todas');
    setSelectedType('Todos');
    setCurrentPage(1);
  };

  // Open Ticket Details
  const handleOpenTicket = (ticket: Ticket) => {
    setSelectedTicketId(ticket.id);
    setIsDrawerOpen(true);
  };

  // Change Status Handler with System Log
  const handleChangeStatus = (ticketId: string, newStatus: TicketStatus) => {
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;
    const oldStatus = target.status;
    if (oldStatus === newStatus) return;

    const sysLog = createSystemLog(
      'Técnico Operador',
      `Status operacional alterado de "${oldStatus}" para "${newStatus}".`,
      { oldStatus, newStatus, action: 'status_change' }
    );

    const updated = tickets.map((t) =>
      t.id === ticketId
        ? {
            ...t,
            status: newStatus,
            closedAt:
              newStatus === 'Resolvido' || newStatus === 'Fechado'
                ? 'Hoje'
                : t.closedAt,
            messages: [...t.messages, sysLog],
          }
        : t
    );

    persistTickets(updated);
    showToast(`Status do chamado ${target.code} alterado para "${newStatus}".`);

    // Prompt CSAT modal if newly resolved and not rated
    if ((newStatus === 'Resolvido' || newStatus === 'Fechado') && !target.csat) {
      setTimeout(() => {
        setSelectedTicketId(target.id);
        setIsCsatModalOpen(true);
      }, 500);
    }
  };

  // Send message in chat/notes
  const handleSendMessage = (e: FormEvent) => {
    e.preventDefault();
    if (!composerText.trim() || !selectedTicket) return;

    const newMsg: Message = {
      id: Date.now(),
      author: isInternalNote ? 'Marina Costa (Nota Técnica)' : 'Marina Costa',
      text: composerText.trim(),
      time: 'Agora',
      type: isInternalNote ? 'note' : 'support',
    };

    persistTickets(
      tickets.map((t) =>
        t.id === selectedTicket.id ? { ...t, messages: [...t.messages, newMsg] } : t
      )
    );
    setComposerText('');
    showToast(isInternalNote ? 'Nota interna confidencial salva.' : 'Resposta enviada ao cliente.');
  };

  // Toggle checklist item
  const handleToggleChecklist = (ticketId: string, itemId: string) => {
    persistTickets(
      tickets.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          checklist: t.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)),
        };
      })
    );
  };

  // Homologate Triage
  const handleTriageSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const sysLog = createSystemLog(
      'Líder Técnico (Triagem)',
      `Triagem homologada. Prioridade definida para "${triagePriority}" e atendimento atribuído a ${triageTechnician}.`,
      { oldStatus: selectedTicket.status, newStatus: 'Em Atendimento', action: 'triage_homologated' }
    );

    const updated = tickets.map((t) => {
      if (t.id !== selectedTicket.id) return t;
      return {
        ...t,
        status: 'Em Atendimento' as TicketStatus,
        priority: triagePriority,
        technician: triageTechnician,
        technicianInitials: triageTechnician
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        messages: [...t.messages, sysLog],
      };
    });

    persistTickets(updated);
    setIsTriageModalOpen(false);
    showToast(`Triagem do chamado ${selectedTicket.code} homologada com sucesso!`);
  };

  // Transfer Queue Handler
  const handleTransferQueueSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !transferReason.trim()) return;

    const oldQueue = selectedTicket.queueName || 'Fila Anterior';
    const targetQueue = getQueueById(transferTargetQueueId);
    const requiresTriage = targetQueue.requiresTriage;

    const sysLog = createSystemLog(
      'Equipe de Atendimento',
      `Chamado transferido da fila "${oldQueue}" para a fila "${targetQueue.name}". Justificativa: "${transferReason.trim()}".${requiresTriage ? ' Reencaminhado para supervisão de triagem.' : ''}`,
      { fromQueue: oldQueue, toQueue: targetQueue.name, action: 'queue_transferred' }
    );

    const updated = tickets.map((t) => {
      if (t.id !== selectedTicket.id) return t;
      return {
        ...t,
        queueId: targetQueue.id,
        queueName: targetQueue.name,
        status: (requiresTriage ? 'Em Triagem' : t.status) as TicketStatus,
        technician: targetQueue.technicians[0] || 'Não Atribuído',
        technicianInitials: (targetQueue.technicians[0] || 'NA')
          .split(' ')
          .map((n) => n[0])
          .join('')
          .slice(0, 2)
          .toUpperCase(),
        messages: [...t.messages, sysLog],
      };
    });

    persistTickets(updated);
    setIsTransferModalOpen(false);
    setTransferReason('');
    showToast(`Chamado ${selectedTicket.code} transferido para "${targetQueue.name}"!`);
  };

  // Add Observer Handler
  const handleAddObserver = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !observerNameInput.trim() || !observerEmailInput.trim()) return;

    const newObs: Observer = {
      id: `obs-${Date.now()}`,
      name: observerNameInput.trim(),
      email: observerEmailInput.trim(),
      addedAt: 'Hoje',
    };

    const sysLog = createSystemLog(
      'Supervisor de Atendimento',
      `Novo observador adicionado em cópia: ${newObs.name} (${newObs.email}).`,
      { action: 'observer_added' }
    );

    const updated = tickets.map((t) => {
      if (t.id !== selectedTicket.id) return t;
      return {
        ...t,
        observers: [...(t.observers || []), newObs],
        messages: [...t.messages, sysLog],
      };
    });

    persistTickets(updated);
    setIsObserverModalOpen(false);
    setObserverNameInput('');
    setObserverEmailInput('');
    showToast(`Observador ${newObs.name} adicionado em cópia!`);
  };

  // CSAT Rating Submit
  const handleCsatSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const rating: CSATRating = {
      score: csatScoreInput,
      comment: csatCommentInput.trim() || undefined,
      ratedAt: 'Hoje',
    };

    const sysLog = createSystemLog(
      'Cliente (Pesquisa CSAT)',
      `Avaliação de atendimento registrada: ${csatScoreInput} de 5 estrelas. ${rating.comment ? `"${rating.comment}"` : ''}`,
      { action: 'csat_recorded' }
    );

    const updated = tickets.map((t) => {
      if (t.id !== selectedTicket.id) return t;
      return {
        ...t,
        csat: rating,
        messages: [...t.messages, sysLog],
      };
    });

    persistTickets(updated);
    setIsCsatModalOpen(false);
    setCsatCommentInput('');
    showToast(`Obrigado! Avaliação de ${csatScoreInput} estrelas gravada com sucesso.`);
  };

  // Reopen Ticket Submit
  const handleReopenSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !reopenReasonInput.trim()) return;

    const sysLog = createSystemLog(
      'Solicitante (Cliente)',
      `Chamado reaberto pelo cliente na janela de garantia. Motivo: "${reopenReasonInput.trim()}".`,
      { oldStatus: selectedTicket.status, newStatus: 'Em Atendimento', action: 'ticket_reopened' }
    );

    const updated = tickets.map((t) => {
      if (t.id !== selectedTicket.id) return t;
      return {
        ...t,
        status: 'Em Atendimento' as TicketStatus,
        reopenedAt: 'Agora',
        reopenReason: reopenReasonInput.trim(),
        messages: [...t.messages, sysLog],
      };
    });

    persistTickets(updated);
    setIsReopenModalOpen(false);
    setReopenReasonInput('');
    showToast(`Chamado ${selectedTicket.code} reaberto e reenviado para a equipe técnica!`);
  };

  // 1. Iniciar Suporte Remoto (Decisão: Sim, pode resolver remotamente)
  const handleStartRemoteSessionSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const remoteInfo = {
      tool: remoteTool,
      sessionCode: remoteSessionCode || `NESH-${Math.floor(1000 + Math.random() * 9000)}`,
      authorizedBy: selectedTicket.requester || 'Solicitante Autorizado',
      authorizedAt: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      technician: selectedTicket.technician || 'Rafael Lima',
      status: 'Conectado' as const,
    };

    const sysLog = createSystemLog(
      'NOC Nesher Tech',
      `Sessão de suporte remoto autorizada via ${remoteInfo.tool}. ID de conexão: ${remoteInfo.sessionCode}. Conexão criptografada estabelecida com ${remoteInfo.authorizedBy}.`,
      { action: 'remote_session_started' }
    );

    const updated = tickets.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            serviceType: 'Remoto' as ServiceType,
            status: (t.status === 'Novo' || t.status === 'Em Triagem' ? 'Em Atendimento' : t.status) as TicketStatus,
            remoteSession: remoteInfo,
            messages: [...t.messages, sysLog],
          }
        : t
    );

    persistTickets(updated);
    setIsRemoteSessionModalOpen(false);
    showToast(`Sessão de suporte remoto (${remoteInfo.tool}) vinculada com sucesso!`);
  };

  // 2. Agendar Visita Presencial (Decisão: Não, requer visita de campo)
  const handleScheduleFieldVisitSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const visitInfo = {
      visitId: `VIS-${Date.now().toString().slice(-4)}`,
      technician: fieldTech || 'Lucas Silva',
      scheduledDate: fieldDate || 'Amanhã',
      scheduledTime: fieldTime || '09:00 - 11:30',
      address: fieldAddress.trim() || `Unidade ${selectedTicket.company}`,
      status: 'Agendada' as const,
    };

    const sysLog = createSystemLog(
      'Central de Atendimento Nesher',
      `Atendimento presencial autorizado pelo protocolo técnico. Visita agendada para ${visitInfo.scheduledDate} (${visitInfo.scheduledTime}) com o técnico ${visitInfo.technician}. Local: ${visitInfo.address}.`,
      { action: 'field_visit_scheduled' }
    );

    const updated = tickets.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            serviceType: 'Campo' as ServiceType,
            technician: visitInfo.technician,
            status: (t.status === 'Novo' || t.status === 'Em Triagem' ? 'Em Atendimento' : t.status) as TicketStatus,
            fieldVisit: visitInfo,
            messages: [...t.messages, sysLog],
          }
        : t
    );

    persistTickets(updated);

    // Synchronize with nesher_visits
    try {
      const storedVisits = localStorage.getItem('nesher_visits');
      const visitsList = storedVisits ? JSON.parse(storedVisits) : [];
      visitsList.push({
        id: visitInfo.visitId,
        code: `#VIS-${Math.floor(1000 + Math.random() * 9000)}`,
        companyName: selectedTicket.company,
        address: visitInfo.address,
        city: 'São Paulo',
        state: 'SP',
        contactName: selectedTicket.requester,
        contactPhone: selectedTicket.requesterPhone,
        ticketCode: selectedTicket.code,
        ticketSubject: selectedTicket.subject,
        scheduledDate: visitInfo.scheduledDate,
        scheduledTime: visitInfo.scheduledTime,
        technicianName: visitInfo.technician,
        technicianInitials: visitInfo.technician.slice(0, 2).toUpperCase(),
        status: 'Agendada',
        checklist: [
          { id: '1', task: 'Inspeção física e diagnóstico no local', completed: false },
          { id: '2', task: 'Reparo / troca de componente ou configuração', completed: false },
          { id: '3', task: 'Testes de validação e coleta de assinatura', completed: false },
        ],
      });
      localStorage.setItem('nesher_visits', JSON.stringify(visitsList));
    } catch {}

    setIsFieldVisitModalOpen(false);
    showToast(`Visita técnica presencial agendada com ${visitInfo.technician}!`);
  };

  // 3. Registrar Laudo Técnico & Solução
  const handleSaveReportSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !reportDiagnostic.trim() || !reportSolution.trim()) return;

    const report = {
      diagnostic: reportDiagnostic.trim(),
      solution: reportSolution.trim(),
      recommendations: reportRecommendations.trim() || 'Manter rotina preventiva e boas práticas operacionais.',
    };

    const sysLog = createSystemLog(
      selectedTicket.technician || 'Técnico Responsável',
      `Parecer técnico e solução registrados: "${report.solution}". Pronto para confirmação do cliente.`,
      { action: 'technical_report_saved' }
    );

    const updated = tickets.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            technicalReport: report,
            messages: [...t.messages, sysLog],
          }
        : t
    );

    persistTickets(updated);
    setIsReportModalOpen(false);
    showToast(`Laudo técnico registrado com sucesso!`);
  };

  // 4. Confirmação do Cliente & Encerramento
  const handleClientConfirmSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    const confirmation = {
      confirmedBy: confirmClientName.trim() || selectedTicket.requester,
      confirmedAt: 'Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      method: confirmMethod,
    };

    const sysLog = createSystemLog(
      confirmation.confirmedBy,
      `Cliente confirmou formalmente a resolução do chamado (${confirmation.method}). Laudo técnico aceito e Ordem de Serviço concluída.`,
      { action: 'client_confirmed_resolution' }
    );

    const updated = tickets.map((t) =>
      t.id === selectedTicket.id
        ? {
            ...t,
            status: 'Resolvido' as TicketStatus,
            closedAt: 'Hoje',
            clientConfirmation: confirmation,
            messages: [...t.messages, sysLog],
          }
        : t
    );

    persistTickets(updated);
    setIsClientConfirmModalOpen(false);
    showToast(`Chamado concluído e confirmado com sucesso pelo cliente!`);

    // Prompt CSAT rating automatically
    setTimeout(() => {
      setIsCsatModalOpen(true);
    }, 450);
  };

  // Create New Ticket
  const handleCreateTicket = (e: FormEvent) => {
    e.preventDefault();
    const finalCompany = newCompany.trim() || 'Empresa Padrão';
    if (!newSubject.trim() || !newRequester.trim()) return;

    const targetQueue = getQueueById(newQueueId);
    const initialStatus: TicketStatus = targetQueue.requiresTriage ? 'Em Triagem' : 'Novo';

    const newNumber = tickets.length + 1001;
    const newCode = `#NS-${newNumber}`;
    const newId = `NS-${newNumber}`;

    const creationLog = createSystemLog(
      'Sistema LogiFlow',
      `Chamado criado e encaminhado para a fila "${targetQueue.name}". ${targetQueue.requiresTriage ? 'Aguardando homologação de triagem pelo supervisor.' : 'Atendimento liberado para a fila geral.'}`,
      { toQueue: targetQueue.name, action: 'ticket_created' }
    );

    const created: Ticket = {
      id: newId,
      code: newCode,
      subject: newSubject.trim(),
      description: newDescription.trim() || 'Sem descrição adicional.',
      company: finalCompany,
      requester: newRequester.trim(),
      requesterEmail: `${newRequester.toLowerCase().replace(/\s+/g, '.')}@${finalCompany.toLowerCase().replace(/[^a-z0-9]/g, '') || 'cliente'}.com`,
      requesterPhone: '(11) 99000-1122',
      queueId: targetQueue.id,
      queueName: targetQueue.name,
      category: newCategory,
      serviceType: newServiceType,
      priority: newPriority,
      status: initialStatus,
      slaRemaining: `${targetQueue.slaResolutionHours}h 00m restantes`,
      slaStatus: 'normal',
      technician: targetQueue.technicians[0] || 'Não Atribuído',
      technicianInitials: (targetQueue.technicians[0] || 'NA')
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      asset:
        newAssetModel || newAssetTag
          ? {
              tag: newAssetTag.trim() || undefined,
              type: newCategory === 'Redes' ? 'Switch/Roteador' : 'Equipamento',
              brand: newAssetBrand || 'Genérica',
              model: newAssetModel || 'Estação Padrão',
              serial: newAssetSerial || 'SN-PENDENTE',
            }
          : undefined,
      observers: newObserverEmail.trim()
        ? [
            {
              id: 'obs-1',
              name: 'Observador do Cliente',
              email: newObserverEmail.trim(),
              addedAt: 'Hoje',
            },
          ]
        : [],
      createdAt: 'Agora',
      messages: [
        creationLog,
        {
          id: 1,
          author: newRequester,
          text: newDescription || newSubject,
          time: 'Agora',
          type: 'client',
        },
      ],
      checklist: [
        { id: 'c1', text: 'Triagem inicial e confirmação de escopo', done: !targetQueue.requiresTriage },
        { id: 'c2', text: 'Atribuição ao técnico especialista', done: false },
        { id: 'c3', text: 'Execução e testes finais de entrega', done: false },
      ],
    };

    persistTickets([created, ...tickets]);
    setIsNewModalOpen(false);
    setSelectedTicketId(created.id);
    showToast(`Chamado ${newCode} registrado na fila "${targetQueue.name}" com sucesso!`);

    // Reset Form
    setNewSubject('');
    setNewRequester('');
    setNewAssetTag('');
    setNewAssetBrand('');
    setNewAssetModel('');
    setNewAssetSerial('');
    setNewObserverEmail('');
    setNewDescription('');
  };

  return (
    <div className="nesher-tickets-shell">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="nesher-toast">
          <i className="ti ti-check" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Main Actions */}
      <header className="nesher-tickets-header">
        <div>
          <p className="eyebrow">Service Desk & Ordens de Serviço</p>
          <h1>Central de Chamados e OS</h1>
          <p>
            Gerencie o ciclo completo de incidentes, atendimentos em campo, manutenções e laudos técnicos da Nesher Tech.
          </p>
        </div>

        <div className="nesher-tickets-actions">
          <button
            type="button"
            className="nesher-btn-secondary"
            onClick={() => showToast('Exportando relatório de chamados em CSV...')}
          >
            <i className="ti ti-download" />
            <span>Exportar</span>
          </button>

          <button
            type="button"
            className="nesher-btn-primary"
            onClick={() => setIsNewModalOpen(true)}
          >
            <i className="ti ti-plus" />
            <span>Nova Ordem de Serviço</span>
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="nesher-kpi-grid" aria-label="Indicadores da Central">
        <div className="nesher-kpi-card">
          <span className="nesher-kpi-icon blue">
            <i className="ti ti-inbox" />
          </span>
          <div className="nesher-kpi-content">
            <span>Total na Fila</span>
            <strong>{kpiMetrics.total}</strong>
            <small>Chamados registrados</small>
          </div>
        </div>

        <div className="nesher-kpi-card">
          <span className="nesher-kpi-icon amber">
            <i className="ti ti-clock-play" />
          </span>
          <div className="nesher-kpi-content">
            <span>Novos / Triagem</span>
            <strong>{kpiMetrics.novos}</strong>
            <small>Aguardando técnico</small>
          </div>
        </div>

        <div className="nesher-kpi-card">
          <span className="nesher-kpi-icon indigo">
            <i className="ti ti-tool" />
          </span>
          <div className="nesher-kpi-content">
            <span>Em Atendimento</span>
            <strong>{kpiMetrics.atendimento}</strong>
            <small>Técnicos em ação</small>
          </div>
        </div>

        <div className="nesher-kpi-card">
          <span className="nesher-kpi-icon rose">
            <i className="ti ti-alert-triangle" />
          </span>
          <div className="nesher-kpi-content">
            <span>SLA em Risco</span>
            <strong>{kpiMetrics.slaRisco}</strong>
            <small>Atenção prioritária</small>
          </div>
        </div>

        <div className="nesher-kpi-card">
          <span className="nesher-kpi-icon emerald">
            <i className="ti ti-circle-check" />
          </span>
          <div className="nesher-kpi-content">
            <span>Resolvidos</span>
            <strong>{kpiMetrics.resolvidos}</strong>
            <small>Concluídos com sucesso</small>
          </div>
        </div>
      </section>

      {/* Filter & Search Toolbar */}
      <section className="nesher-ticket-toolbar">
        {/* Top row: Quick tabs + View Switcher */}
        <div className="nesher-toolbar-top">
          <div className="nesher-tabs-bar">
            <button
              type="button"
              className={`nesher-tab-btn ${activeQuickTab === 'todos' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveQuickTab('todos');
                setCurrentPage(1);
              }}
            >
              Todos <span className="nesher-tab-badge">{tickets.length}</span>
            </button>

            <button
              type="button"
              className={`nesher-tab-btn ${activeQuickTab === 'triagem' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveQuickTab('triagem');
                setCurrentPage(1);
              }}
            >
              <i className="ti ti-shield-search" style={{ marginRight: 4 }} />
              Aguardando Triagem{' '}
              {kpiMetrics.triagem > 0 && (
                <span className="nesher-tab-badge" style={{ background: '#7e22ce', color: '#fff' }}>
                  {kpiMetrics.triagem}
                </span>
              )}
            </button>

            <button
              type="button"
              className={`nesher-tab-btn ${activeQuickTab === 'meus' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveQuickTab('meus');
                setCurrentPage(1);
              }}
            >
              Meus Atendimentos
            </button>

            <button
              type="button"
              className={`nesher-tab-btn ${activeQuickTab === 'nao_atribuidos' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveQuickTab('nao_atribuidos');
                setCurrentPage(1);
              }}
            >
              Não Atribuídos
            </button>

            <button
              type="button"
              className={`nesher-tab-btn ${activeQuickTab === 'urgentes' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveQuickTab('urgentes');
                setCurrentPage(1);
              }}
            >
              Críticos / Alta
            </button>

            <button
              type="button"
              className={`nesher-tab-btn ${activeQuickTab === 'atendimento' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveQuickTab('atendimento');
                setCurrentPage(1);
              }}
            >
              Em Campo / Atendimento
            </button>

            <button
              type="button"
              className={`nesher-tab-btn ${activeQuickTab === 'aguardando' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveQuickTab('aguardando');
                setCurrentPage(1);
              }}
            >
              Aguardando
            </button>

            <button
              type="button"
              className={`nesher-tab-btn ${activeQuickTab === 'resolvidos' ? 'is-active' : ''}`}
              onClick={() => {
                setActiveQuickTab('resolvidos');
                setCurrentPage(1);
              }}
            >
              Resolvidos
            </button>
          </div>

          {/* View Switcher: Table | Kanban | Split */}
          <div className="nesher-view-switcher" role="group" aria-label="Modo de visualização">
            <button
              type="button"
              className={`nesher-view-btn ${viewMode === 'table' ? 'is-active' : ''}`}
              onClick={() => setViewMode('table')}
              title="Visualização em Tabela Paginada"
            >
              <i className="ti ti-table" />
              <span>Tabela</span>
            </button>

            <button
              type="button"
              className={`nesher-view-btn ${viewMode === 'kanban' ? 'is-active' : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Visualização em Quadro Kanban"
            >
              <i className="ti ti-layout-kanban" />
              <span>Kanban</span>
            </button>

            <button
              type="button"
              className={`nesher-view-btn ${viewMode === 'split' ? 'is-active' : ''}`}
              onClick={() => setViewMode('split')}
              title="Visualização Dividida (Fila + Atendimento)"
            >
              <i className="ti ti-columns" />
              <span>Atendimento</span>
            </button>
          </div>
        </div>

        {/* Bottom row: Search input + Queue/Category/Priority/Type selects */}
        <div className="nesher-toolbar-filters">
          <div className="nesher-search-box">
            <i className="ti ti-search" />
            <input
              type="text"
              placeholder="Buscar por código #NS, assunto, empresa, solicitante ou ativo..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Fila de Atendimento (Queue) Dropdown */}
          <select
            className="nesher-filter-select"
            value={selectedQueue}
            onChange={(e) => {
              setSelectedQueue(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="Todas">Todas as Filas (Queues)</option>
            {serviceQueues.map((q) => (
              <option key={q.id} value={q.id}>
                {q.name}
              </option>
            ))}
          </select>

          <select
            className="nesher-filter-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
          >
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'Todas' ? 'Todas as Categorias' : cat}
              </option>
            ))}
          </select>

          <select
            className="nesher-filter-select"
            value={selectedPriority}
            onChange={(e) => {
              setSelectedPriority(e.target.value);
              setCurrentPage(1);
            }}
          >
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p === 'Todas' ? 'Todas as Prioridades' : `Prioridade: ${p}`}
              </option>
            ))}
          </select>

          <select
            className="nesher-filter-select"
            value={selectedType}
            onChange={(e) => {
              setSelectedType(e.target.value as any);
              setCurrentPage(1);
            }}
          >
            {typeOptions.map((t) => (
              <option key={t} value={t}>
                {t === 'Todos' ? 'Todos os Tipos' : `Atendimento: ${t}`}
              </option>
            ))}
          </select>

          {(searchQuery ||
            selectedCategory !== 'Todas' ||
            selectedPriority !== 'Todas' ||
            selectedType !== 'Todos' ||
            activeQuickTab !== 'todos') && (
            <button
              type="button"
              className="nesher-btn-reset"
              onClick={resetFilters}
              title="Limpar todos os filtros"
            >
              <i className="ti ti-filter-off" />
              <span>Limpar filtros</span>
            </button>
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 1. VIEW MODE: DATA TABLE COM PAGINAÇÃO PROFISSIONAL                       */}
      {/* ========================================================================= */}
      {viewMode === 'table' && (
        <section className="nesher-table-card">
          <div className="nesher-table-container">
            <table className="nesher-data-table">
              <thead>
                <tr>
                  <th
                    className="sortable"
                    onClick={() => {
                      if (sortBy === 'code') setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('code');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    OS / Código {sortBy === 'code' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Assunto & Categoria</th>
                  <th>Cliente & Solicitante</th>
                  <th>Tipo</th>
                  <th
                    className="sortable"
                    onClick={() => {
                      if (sortBy === 'priority') setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
                      else {
                        setSortBy('priority');
                        setSortOrder('desc');
                      }
                    }}
                  >
                    Prioridade {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Status</th>
                  <th>SLA / Prazo</th>
                  <th>Técnico</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>

              <tbody>
                {paginatedTickets.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '56px 20px', color: '#94a3b8' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: '#64748b', fontSize: 28 }}>
                          <i className="ti ti-ticket" />
                        </div>
                        <strong style={{ fontSize: 16, color: '#1e293b', marginBottom: 6 }}>
                          {tickets.length === 0 ? 'Nenhum chamado registrado (Base Zerada)' : 'Nenhum chamado encontrado'}
                        </strong>
                        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#64748b', maxWidth: 440 }}>
                          {tickets.length === 0
                            ? 'A central de chamados e ordens de serviço está vazia e pronta para os primeiros atendimentos reais.'
                            : 'Tente limpar os filtros ou buscar por outros termos de pesquisa.'}
                        </p>
                        {tickets.length === 0 ? (
                          <button
                            type="button"
                            className="nesher-btn-primary"
                            onClick={() => setIsNewModalOpen(true)}
                          >
                            <i className="ti ti-plus" />
                            <span>+ Abrir Primeiro Chamado</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="nesher-btn-secondary"
                            onClick={resetFilters}
                          >
                            <i className="ti ti-rotate-clockwise" />
                            <span>Limpar Filtros</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedTickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      onClick={() => handleOpenTicket(ticket)}
                      className={ticket.id === selectedTicketId ? 'is-selected' : ''}
                    >
                      {/* Código & Fila de Atendimento (USPDev Queues) */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className="nesher-code-badge">{ticket.code}</span>
                          {ticket.queueName && (
                            <span className={`nesher-queue-badge ${getQueueById(ticket.queueId).color}`}>
                              <i className="ti ti-git-branch" style={{ fontSize: 10 }} />
                              {ticket.queueName.split(' - ')[0]}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assunto & Categoria & Patrimônio */}
                      <td>
                        <div className="nesher-subject-cell">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {ticket.asset?.tag && (
                              <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '1px 5px', borderRadius: 4, border: '1px solid #bfdbfe' }}>
                                {ticket.asset.tag}
                              </span>
                            )}
                            <strong title={ticket.subject}>{ticket.subject}</strong>
                          </div>
                          <div className="nesher-subject-meta">
                            <span className="nesher-category-tag">{ticket.category}</span>
                            {ticket.asset && (
                              <span>
                                · <i className="ti ti-devices" style={{ verticalAlign: -1 }} /> {ticket.asset.brand} {ticket.asset.model}
                              </span>
                            )}
                            {ticket.observers && ticket.observers.length > 0 && (
                              <span style={{ color: '#64748b' }}>
                                · <i className="ti ti-users" style={{ verticalAlign: -1 }} /> {ticket.observers.length} em cópia
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Cliente & Solicitante */}
                      <td>
                        <div className="nesher-client-cell">
                          <strong>{ticket.company}</strong>
                          <span>{ticket.requester}</span>
                        </div>
                      </td>

                      {/* Tipo */}
                      <td>
                        <span className="nesher-type-pill">
                          <i
                            className={
                              ticket.serviceType === 'Campo'
                                ? 'ti ti-truck'
                                : ticket.serviceType === 'Laboratório'
                                ? 'ti ti-microscope'
                                : 'ti ti-device-desktop'
                            }
                          />
                          {ticket.serviceType}
                        </span>
                      </td>

                      {/* Prioridade */}
                      <td>
                        <span
                          className={`nesher-priority-badge ${ticket.priority.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}
                        >
                          <i
                            className="ti ti-point-filled"
                            style={{ fontSize: 8 }}
                          />
                          {ticket.priority}
                        </span>
                      </td>

                      {/* Status & Triagem Quick Action */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                          <span
                            className={`nesher-status-badge ${ticket.status
                              .toLowerCase()
                              .replace(/\s+/g, '-')
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')}`}
                          >
                            {ticket.status}
                          </span>
                          {ticket.status === 'Em Triagem' && (
                            <button
                              type="button"
                              style={{
                                padding: '2px 8px',
                                borderRadius: 4,
                                background: '#7e22ce',
                                color: '#ffffff',
                                fontSize: 10.5,
                                fontWeight: 700,
                                border: 0,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTicketId(ticket.id);
                                setIsTriageModalOpen(true);
                              }}
                              title="Homologar e atribuir chamado"
                            >
                              <i className="ti ti-check" /> Homologar
                            </button>
                          )}
                          {ticket.csat && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 2, color: '#eab308', fontSize: 11 }}>
                              <i className="ti ti-star-filled" />
                              <span style={{ fontWeight: 800, color: '#854d0e' }}>{ticket.csat.score}.0</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* SLA */}
                      <td>
                        <span className={`nesher-sla-pill ${ticket.slaStatus}`}>
                          <i className="ti ti-clock" style={{ fontSize: 13 }} />
                          {ticket.slaRemaining}
                        </span>
                      </td>

                      {/* Técnico Responsável */}
                      <td>
                        <div className="nesher-tech-cell">
                          <span className="nesher-tech-avatar">{ticket.technicianInitials}</span>
                          <span>{ticket.technician}</span>
                        </div>
                      </td>

                      {/* Ações Rápidas */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <button
                            type="button"
                            className="nesher-action-btn"
                            title="Transferir fila"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTicketId(ticket.id);
                              setIsTransferModalOpen(true);
                            }}
                          >
                            <i className="ti ti-arrows-exchange" />
                          </button>
                          <button
                            type="button"
                            className="nesher-action-btn"
                            title="Ver detalhes da Ordem de Serviço"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenTicket(ticket);
                            }}
                          >
                            <i className="ti ti-chevron-right" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <footer className="nesher-pagination-bar">
            <div className="nesher-pagination-info">
              Mostrando{' '}
              <strong>
                {sortedTickets.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1}
              </strong>{' '}
              a{' '}
              <strong>
                {Math.min(safeCurrentPage * pageSize, sortedTickets.length)}
              </strong>{' '}
              de <strong>{sortedTickets.length}</strong> chamados encontrados
            </div>

            <div className="nesher-pagination-controls">
              {/* Page Size Selector */}
              <div className="nesher-page-size-selector">
                <span>Itens por página:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              {/* First & Prev */}
              <button
                type="button"
                className="nesher-page-btn"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
                title="Primeira página"
              >
                <i className="ti ti-chevrons-left" />
              </button>

              <button
                type="button"
                className="nesher-page-btn"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                title="Página anterior"
              >
                <i className="ti ti-chevron-left" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  return (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - safeCurrentPage) <= 1
                  );
                })
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  return (
                    <span key={p} style={{ display: 'inline-flex', alignItems: 'center' }}>
                      {prev && p - prev > 1 && <span style={{ padding: '0 4px', color: '#94a3b8' }}>…</span>}
                      <button
                        type="button"
                        className={`nesher-page-btn ${safeCurrentPage === p ? 'is-active' : ''}`}
                        onClick={() => setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}

              {/* Next & Last */}
              <button
                type="button"
                className="nesher-page-btn"
                disabled={safeCurrentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                title="Próxima página"
              >
                <i className="ti ti-chevron-right" />
              </button>

              <button
                type="button"
                className="nesher-page-btn"
                disabled={safeCurrentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage(totalPages)}
                title="Última página"
              >
                <i className="ti ti-chevrons-right" />
              </button>
            </div>
          </footer>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 2. VIEW MODE: KANBAN BOARD                                                */}
      {/* ========================================================================= */}
      {viewMode === 'kanban' && (
        <section className="nesher-kanban-board">
          {(
            [
              'Novo',
              'Em Triagem',
              'Em Atendimento',
              'Aguardando Peças',
              'Aguardando Cliente',
              'Resolvido',
            ] as TicketStatus[]
          ).map((colStatus) => {
            const colTickets = filteredTickets.filter((t) => t.status === colStatus);

            return (
              <div key={colStatus} className="nesher-kanban-column">
                <header className="nesher-kanban-header">
                  <h3>
                    <span>{colStatus}</span>
                  </h3>
                  <span className="nesher-kanban-count">{colTickets.length}</span>
                </header>

                <div className="nesher-kanban-list">
                  {colTickets.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 8px', color: '#94a3b8', fontSize: 12 }}>
                      Nenhum chamado
                    </div>
                  ) : (
                    colTickets.map((ticket) => (
                      <article
                        key={ticket.id}
                        className="nesher-kanban-card"
                        onClick={() => handleOpenTicket(ticket)}
                      >
                        <div className="nesher-kanban-card-top">
                          <span className="nesher-code-badge">{ticket.code}</span>
                          <span
                            className={`nesher-priority-badge ${ticket.priority
                              .toLowerCase()
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '')}`}
                          >
                            {ticket.priority}
                          </span>
                        </div>

                        <h4 className="nesher-kanban-card-title">{ticket.subject}</h4>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#64748b' }}>
                          <i className="ti ti-building" />
                          <span>{ticket.company}</span>
                        </div>

                        {ticket.asset && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#475569', background: '#f8fafc', padding: '4px 6px', borderRadius: 4 }}>
                            <i className="ti ti-device-laptop" />
                            <span>{ticket.asset.brand} {ticket.asset.model}</span>
                          </div>
                        )}

                        <div className="nesher-kanban-card-bottom">
                          <span className={`nesher-sla-pill ${ticket.slaStatus}`} style={{ fontSize: 10.5 }}>
                            <i className="ti ti-clock" />
                            {ticket.slaRemaining}
                          </span>

                          <div className="nesher-tech-cell">
                            <span className="nesher-tech-avatar">{ticket.technicianInitials}</span>
                            <span style={{ fontSize: 11 }}>{ticket.technician.split(' ')[0]}</span>
                          </div>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* ========================================================================= */}
      {/* 3. VIEW MODE: SPLIT INBOX (LISTA + CHAT / DETALHES AO LADO)              */}
      {/* ========================================================================= */}
      {viewMode === 'split' && (
        <section className="nesher-split-layout">
          {/* Left Column: Tickets List */}
          <aside className="nesher-split-sidebar">
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <strong style={{ fontSize: 13, color: '#1e293b' }}>Chamados Ativos</strong>
              <span style={{ fontSize: 11, color: '#64748b' }}>{filteredTickets.length} itens</span>
            </div>

            <div className="nesher-split-list">
              {filteredTickets.map((t) => (
                <button
                  type="button"
                  key={t.id}
                  className={`nesher-split-item ${t.id === selectedTicketId ? 'is-active' : ''}`}
                  onClick={() => setSelectedTicketId(t.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="nesher-code-badge" style={{ fontSize: 10.5 }}>{t.code}</span>
                    <span className={`nesher-priority-badge ${t.priority.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} style={{ fontSize: 10 }}>
                      {t.priority}
                    </span>
                  </div>
                  <strong style={{ fontSize: 12.5, color: '#0f172a', lineHeight: 1.3 }}>{t.subject}</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#64748b' }}>
                    <span>{t.company}</span>
                    <span className={`nesher-status-badge ${t.status.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`} style={{ fontSize: 10, padding: '2px 6px' }}>
                      {t.status}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Right Column: Active Ticket Details & Conversation */}
          <main className="nesher-split-detail">
            {selectedTicket ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Header */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: '#f8fafc' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span className="nesher-code-badge">{selectedTicket.code}</span>
                      <span className={`nesher-status-badge ${selectedTicket.status.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}>
                        {selectedTicket.status}
                      </span>
                      <span className={`nesher-priority-badge ${selectedTicket.priority.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}>
                        Prioridade {selectedTicket.priority}
                      </span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>{selectedTicket.subject}</h2>
                    <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b' }}>
                      Cliente: <strong>{selectedTicket.company}</strong> · Solicitante: {selectedTicket.requester} · {selectedTicket.serviceType}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <select
                      className="nesher-filter-select"
                      value={selectedTicket.status}
                      onChange={(e) => handleChangeStatus(selectedTicket.id, e.target.value as TicketStatus)}
                    >
                      <option value="Novo">Novo</option>
                      <option value="Em Triagem">Em Triagem</option>
                      <option value="Em Atendimento">Em Atendimento</option>
                      <option value="Aguardando Peças">Aguardando Peças</option>
                      <option value="Aguardando Cliente">Aguardando Cliente</option>
                      <option value="Resolvido">Resolvido</option>
                      <option value="Fechado">Fechado</option>
                    </select>

                    <button
                      type="button"
                      className="nesher-btn-secondary"
                      onClick={() => setIsPrintModalOpen(true)}
                      title="Imprimir Ordem de Serviço em PDF"
                    >
                      <i className="ti ti-printer" />
                      <span>Imprimir OS</span>
                    </button>

                    <button
                      type="button"
                      className="nesher-btn-secondary"
                      onClick={() => handleOpenTicket(selectedTicket)}
                    >
                      <i className="ti ti-maximize" />
                      <span>Ver OS Completa</span>
                    </button>
                  </div>
                </div>

                {/* Body: Triagem + Fila + Checklist + Chat Messages */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Triage Alert Banner */}
                  {selectedTicket.status === 'Em Triagem' && (
                    <div className="nesher-triage-banner">
                      <div className="nesher-triage-banner-info">
                        <i className="ti ti-shield-alert" />
                        <div>
                          <strong>Aguardando Homologação de Triagem:</strong>
                          <span style={{ display: 'block', fontSize: 11.5, color: '#6b21a8' }}>
                            Fila com supervisão ativa. Homologue a prioridade e confirme o técnico responsável.
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        className="nesher-btn-primary"
                        style={{ background: '#7e22ce', height: 32, fontSize: 12, padding: '0 12px' }}
                        onClick={() => setIsTriageModalOpen(true)}
                      >
                        <i className="ti ti-check" />
                        <span>Homologar Triagem</span>
                      </button>
                    </div>
                  )}

                  {/* Fila & Transfer Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className={`nesher-queue-badge ${getQueueById(selectedTicket.queueId).color}`}>
                        <i className="ti ti-git-branch" /> {selectedTicket.queueName}
                      </span>
                      <span style={{ fontSize: 11.5, color: '#64748b' }}>
                        SLA: {getQueueById(selectedTicket.queueId).slaResponseHours}h resp. / {getQueueById(selectedTicket.queueId).slaResolutionHours}h resol.
                      </span>
                    </div>
                    <button
                      type="button"
                      className="nesher-btn-secondary"
                      style={{ height: 28, padding: '0 10px', fontSize: 11.5 }}
                      onClick={() => {
                        setTransferTargetQueueId(selectedTicket.queueId === 'queue-n1' ? 'queue-n2-net' : 'queue-n1');
                        setIsTransferModalOpen(true);
                      }}
                    >
                      <i className="ti ti-arrows-exchange" />
                      <span>Transferir Fila</span>
                    </button>
                  </div>

                  {/* Observers Bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: 12, color: '#334155' }}>
                        <i className="ti ti-users" style={{ marginRight: 4 }} />
                        Em Cópia (Observadores):
                      </strong>
                      {selectedTicket.observers && selectedTicket.observers.length > 0 ? (
                        selectedTicket.observers.map((obs) => (
                          <span key={obs.id} className="nesher-observer-pill">
                            <i className="ti ti-mail" /> {obs.name} ({obs.email})
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Nenhum observador em cópia</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className="nesher-btn-secondary"
                      style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                      onClick={() => setIsObserverModalOpen(true)}
                    >
                      <i className="ti ti-user-plus" />
                      <span>+ Adicionar</span>
                    </button>
                  </div>

                  {/* Protocolo de Resolução Nesher (Fluxograma: Pode resolver remotamente?) */}
                  <div className="nesher-resolution-protocol-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="nesher-step-badge">Decisão Técnica</span>
                        <strong style={{ fontSize: 12.5, color: '#0f172a' }}>Protocolo de Atendimento</strong>
                      </div>
                      <span style={{ fontSize: 11, color: '#64748b' }}>
                        {selectedTicket.status === 'Resolvido' || selectedTicket.status === 'Fechado'
                          ? '✓ Atendimento Concluído'
                          : 'Triagem & Escalonamento'}
                      </span>
                    </div>

                    {!selectedTicket.remoteSession && !selectedTicket.fieldVisit && (
                      <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: 12 }}>
                        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#334155' }}>
                          🤔 Este incidente pode ser resolvido remotamente?
                        </p>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            className="nesher-btn-remote"
                            onClick={() => setIsRemoteSessionModalOpen(true)}
                          >
                            <i className="ti ti-device-desktop-analytics" />
                            <span>Sim • Iniciar Suporte Remoto</span>
                          </button>

                          <button
                            type="button"
                            className="nesher-btn-field"
                            onClick={() => setIsFieldVisitModalOpen(true)}
                          >
                            <i className="ti ti-calendar-event" />
                            <span>Não • Despachar Visita Presencial</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {selectedTicket.remoteSession && (
                      <div className="nesher-remote-active-pill">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <i className="ti ti-device-desktop-analytics" style={{ fontSize: 20, color: '#0284c7' }} />
                          <div>
                            <strong style={{ display: 'block', fontSize: 12, color: '#0369a1' }}>
                              Suporte Remoto Autorizado ({selectedTicket.remoteSession.tool})
                            </strong>
                            <small style={{ color: '#0284c7', fontSize: 11 }}>
                              Código de Conexão: <b>{selectedTicket.remoteSession.sessionCode}</b> • Técnico: {selectedTicket.remoteSession.technician}
                            </small>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="nesher-pill-action"
                          onClick={() => setIsReportModalOpen(true)}
                        >
                          <i className="ti ti-file-certificate" style={{ marginRight: 4 }} />
                          Registrar Laudo / Solução
                        </button>
                      </div>
                    )}

                    {selectedTicket.fieldVisit && (
                      <div className="nesher-field-active-pill">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <i className="ti ti-truck" style={{ fontSize: 20, color: '#c2410c' }} />
                          <div>
                            <strong style={{ display: 'block', fontSize: 12, color: '#9a3412' }}>
                              Atendimento Presencial Despachado
                            </strong>
                            <small style={{ color: '#c2410c', fontSize: 11 }}>
                              Técnico: <b>{selectedTicket.fieldVisit.technician}</b> • {selectedTicket.fieldVisit.scheduledDate} ({selectedTicket.fieldVisit.scheduledTime})
                            </small>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="nesher-pill-action"
                          onClick={() => setIsReportModalOpen(true)}
                        >
                          <i className="ti ti-file-certificate" style={{ marginRight: 4 }} />
                          Registrar Laudo / Solução
                        </button>
                      </div>
                    )}

                    {selectedTicket.technicalReport && (
                      <div className="nesher-report-summary-box">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <strong style={{ fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="ti ti-certificate" /> Parecer Técnico &amp; Solução Registrados
                          </strong>
                          {!selectedTicket.clientConfirmation ? (
                            <button
                              type="button"
                              className="nesher-btn-confirm-client"
                              onClick={() => setIsClientConfirmModalOpen(true)}
                            >
                              <i className="ti ti-signature" />
                              <span>Colher Confirmação do Cliente</span>
                            </button>
                          ) : (
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#15803d' }}>
                              ✓ Confirmado por {selectedTicket.clientConfirmation.confirmedBy}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 11.5, color: '#14532d', lineHeight: 1.4 }}>
                          <b>Diagnóstico:</b> {selectedTicket.technicalReport.diagnostic} | <b>Solução:</b> {selectedTicket.technicalReport.solution}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CSAT Rating or Prompt */}
                  {selectedTicket.csat ? (
                    <div className="nesher-csat-badge" style={{ padding: '8px 14px', width: '100%', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span>Avaliação do Cliente:</span>
                        <div className="nesher-csat-stars">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <i key={s} className={s <= (selectedTicket.csat?.score || 0) ? 'ti ti-star-filled' : 'ti ti-star'} />
                          ))}
                        </div>
                        {selectedTicket.csat.comment && (
                          <span style={{ fontStyle: 'italic', color: '#713f12', fontSize: 12 }}>
                            &ldquo;{selectedTicket.csat.comment}&rdquo;
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 10.5, color: '#a16207' }}>{selectedTicket.csat.ratedAt}</span>
                    </div>
                  ) : (selectedTicket.status === 'Resolvido' || selectedTicket.status === 'Fechado') ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fefce8', border: '1px solid #fef08a', borderRadius: 8 }}>
                      <span style={{ fontSize: 12, color: '#a16207' }}>
                        ⭐ O chamado foi concluído. Registre a nota de satisfação do cliente.
                      </span>
                      <button
                        type="button"
                        className="nesher-btn-secondary"
                        style={{ height: 28, padding: '0 10px', fontSize: 11.5, borderColor: '#fde047' }}
                        onClick={() => setIsCsatModalOpen(true)}
                      >
                        Avaliar Atendimento (CSAT)
                      </button>
                    </div>
                  ) : null}

                  {/* Reopen Warning / Action */}
                  {(selectedTicket.status === 'Resolvido' || selectedTicket.status === 'Fechado') && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#991b1b' }}>
                        <i className="ti ti-shield-exclamation" style={{ fontSize: 16 }} />
                        <span>Janela de Garantia (7 dias): Se o incidente reincidir, solicite a reabertura.</span>
                      </div>
                      <button
                        type="button"
                        style={{ height: 28, padding: '0 10px', borderRadius: 6, background: '#dc2626', color: '#fff', border: 0, fontWeight: 700, fontSize: 11.5, cursor: 'pointer' }}
                        onClick={() => setIsReopenModalOpen(true)}
                      >
                        <i className="ti ti-rotate" style={{ marginRight: 4 }} />
                        Reabrir
                      </button>
                    </div>
                  )}

                  {/* Equipment Info Box */}
                  {selectedTicket.asset && (
                    <div style={{ padding: '12px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ fontSize: 12, color: '#1e293b' }}>
                          <i className="ti ti-device-laptop" style={{ marginRight: 6 }} />
                          Ativo Vinculado: {selectedTicket.asset.brand} {selectedTicket.asset.model}
                        </strong>
                        <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 2 }}>
                          {selectedTicket.asset.tag && <b style={{ color: '#2563eb', marginRight: 6 }}>Tag: {selectedTicket.asset.tag}</b>}
                          Nº de Série: {selectedTicket.asset.serial} {selectedTicket.asset.accessories ? `· Acessórios: ${selectedTicket.asset.accessories}` : ''}
                        </span>
                      </div>
                      <span className="nesher-type-pill">
                        <i className="ti ti-shield-check" /> Garantia Suporte
                      </span>
                    </div>
                  )}

                  {/* Checklist */}
                  <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                    <strong style={{ display: 'block', fontSize: 12, color: '#334155', marginBottom: 10 }}>
                      <i className="ti ti-checkbox" style={{ marginRight: 6 }} />
                      Checklist Técnico da OS
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {selectedTicket.checklist.map((item) => (
                        <label key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: item.done ? '#64748b' : '#1e293b', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={item.done}
                            onChange={() => handleToggleChecklist(selectedTicket.id, item.id)}
                          />
                          <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>{item.text}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Message Thread with USPDev System Logs & Confidential Notes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <strong style={{ fontSize: 12, color: '#475569' }}>Histórico & Mensagens</strong>
                    {selectedTicket.messages.map((msg) => {
                      if (msg.type === 'system') {
                        return (
                          <div key={msg.id} className="nesher-msg-system">
                            <div className="nesher-msg-system-inner">
                              <i className="ti ti-settings-cog" />
                              <strong>{msg.author}:</strong>
                              <span>{msg.text}</span>
                              <span className="time">({msg.time})</span>
                            </div>
                          </div>
                        );
                      }

                      if (msg.type === 'note') {
                        return (
                          <div key={msg.id} className="nesher-msg-note-box">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="nesher-msg-note-badge">
                                  <i className="ti ti-lock" /> Nota Interna (Sigilo Técnico)
                                </span>
                                <strong style={{ fontSize: 12, color: '#92400e' }}>{msg.author}</strong>
                              </div>
                              <span style={{ fontSize: 11, color: '#b45309' }}>{msg.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12.5, color: '#451a03', lineHeight: 1.4 }}>{msg.text}</p>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 10,
                            background: msg.type === 'support' ? '#eff6ff' : '#f8fafc',
                            border: msg.type === 'support' ? '1px solid #dbeafe' : '1px solid #e2e8f0',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <strong style={{ fontSize: 12, color: msg.type === 'support' ? '#1e40af' : '#0f172a' }}>
                              {msg.author} {msg.type === 'support' && '· Suporte Nesher'}
                            </strong>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{msg.time}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.4 }}>{msg.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Composer Form */}
                <form
                  onSubmit={handleSendMessage}
                  style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 10 }}
                >
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 0,
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: !isInternalNote ? '#dbeafe' : '#e2e8f0',
                        color: !isInternalNote ? '#1e40af' : '#475569',
                      }}
                      onClick={() => setIsInternalNote(false)}
                    >
                      Resposta ao Cliente
                    </button>
                    <button
                      type="button"
                      style={{
                        padding: '4px 10px',
                        borderRadius: 6,
                        border: 0,
                        fontSize: 11.5,
                        fontWeight: 600,
                        cursor: 'pointer',
                        background: isInternalNote ? '#fef3c7' : '#e2e8f0',
                        color: isInternalNote ? '#92400e' : '#475569',
                      }}
                      onClick={() => setIsInternalNote(true)}
                    >
                      <i className="ti ti-lock" style={{ marginRight: 4 }} />
                      Nota Interna (Privada)
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder={isInternalNote ? 'Escrever nota confidencial da equipe...' : 'Escrever mensagem para o cliente...'}
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      style={{
                        flex: 1,
                        height: 40,
                        padding: '0 14px',
                        borderRadius: 8,
                        border: '1px solid #cbd5e1',
                        fontSize: 13,
                        outline: 'none',
                      }}
                    />
                    <button type="submit" className="nesher-btn-primary">
                      <i className="ti ti-send" />
                      <span>Enviar</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 48, color: '#94a3b8', textAlign: 'center' }}>
                <i className="ti ti-ticket-off" style={{ fontSize: 44, marginBottom: 12, opacity: 0.5 }} />
                <h3 style={{ fontSize: 16, color: '#475569', margin: '0 0 6px' }}>Nenhum chamado selecionado</h3>
                <p style={{ fontSize: 13, margin: 0, maxWidth: 360 }}>
                  Selecione um chamado na coluna ao lado para visualizar os detalhes, checklist e mensagens em tempo real.
                </p>
              </div>
            )}
          </main>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL DE ABERTURA: NOVO CHAMADO & ORDEM DE SERVIÇO (OS)                */}
      {/* ========================================================================= */}
      {isNewModalOpen && (
        <div className="nesher-modal-overlay" onClick={() => setIsNewModalOpen(false)}>
          <div className="nesher-modal-card" onClick={(e) => e.stopPropagation()}>
            <header className="nesher-modal-header">
              <h2>
                <i className="ti ti-ticket" style={{ marginRight: 8, color: 'var(--blue-600)' }} />
                Abertura de Chamado & Ordem de Serviço
              </h2>
              <button
                type="button"
                className="nesher-modal-close"
                onClick={() => setIsNewModalOpen(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleCreateTicket}>
              <div className="nesher-modal-body">
                {/* 1. Cliente & Solicitante */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      Empresa Cliente *
                    </label>
                    {registeredCompanies.length > 0 ? (
                      <select
                        className="nesher-filter-select"
                        style={{ width: '100%' }}
                        value={newCompany}
                        onChange={(e) => setNewCompany(e.target.value)}
                        required
                      >
                        {registeredCompanies.map((cName) => (
                          <option key={cName} value={cName}>{cName}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="nesher-filter-select"
                        style={{ width: '100%' }}
                        placeholder="Nome da empresa cliente"
                        required
                        value={newCompany}
                        onChange={(e) => setNewCompany(e.target.value)}
                      />
                    )}
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      Nome do Solicitante *
                    </label>
                    <input
                      type="text"
                      className="nesher-filter-select"
                      style={{ width: '100%' }}
                      placeholder="Ex: Ana Paula"
                      required
                      value={newRequester}
                      onChange={(e) => setNewRequester(e.target.value)}
                    />
                  </div>
                </div>

                {/* 2. Fila de Atendimento Especializada (USPDev Queues) */}
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    <i className="ti ti-git-branch" style={{ marginRight: 6, color: 'var(--blue-600)' }} />
                    Fila de Atendimento Especializada (Queue) *
                  </label>
                  <select
                    className="nesher-filter-select"
                    style={{ width: '100%', marginBottom: 6 }}
                    value={newQueueId}
                    onChange={(e) => setNewQueueId(e.target.value)}
                    required
                  >
                    {serviceQueues.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.name} (SLA: {q.slaResponseHours}h resposta / {q.slaResolutionHours}h resolução)
                      </option>
                    ))}
                  </select>
                  <div style={{ fontSize: 11.5, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{getQueueById(newQueueId).description}</span>
                    {getQueueById(newQueueId).requiresTriage && (
                      <span style={{ color: '#7e22ce', fontWeight: 700 }}>
                        • ⚠️ Exige triagem inicial pelo supervisor
                      </span>
                    )}
                  </div>
                </div>

                {/* 3. Classificação & Tipo */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      Categoria *
                    </label>
                    <select
                      className="nesher-filter-select"
                      style={{ width: '100%' }}
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option value="Infraestrutura">Infraestrutura</option>
                      <option value="Redes">Redes & Conectividade</option>
                      <option value="Hardware">Hardware / Manutenção</option>
                      <option value="Software">Software & ERP</option>
                      <option value="Segurança">Segurança & Backup</option>
                      <option value="Acessos">Acessos & E-mail</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      Tipo de Atendimento *
                    </label>
                    <select
                      className="nesher-filter-select"
                      style={{ width: '100%' }}
                      value={newServiceType}
                      onChange={(e) => setNewServiceType(e.target.value as ServiceType)}
                    >
                      <option value="Remoto">Suporte Remoto</option>
                      <option value="Campo">Presencial (Técnico em Campo)</option>
                      <option value="Laboratório">Laboratório / Bancada</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                      Prioridade *
                    </label>
                    <select
                      className="nesher-filter-select"
                      style={{ width: '100%' }}
                      value={newPriority}
                      onChange={(e) => setNewPriority(e.target.value as Priority)}
                    >
                      <option value="Urgente">Urgente (SLA 1h)</option>
                      <option value="Alta">Alta (SLA 4h)</option>
                      <option value="Média">Média (SLA 8h)</option>
                      <option value="Baixa">Baixa (SLA 24h)</option>
                    </select>
                  </div>
                </div>

                {/* 4. Equipamento / Ativo Vinculado (Opcional) */}
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <strong style={{ display: 'block', fontSize: 12.5, color: '#334155', marginBottom: 8 }}>
                    <i className="ti ti-devices" style={{ marginRight: 6 }} />
                    Dados do Equipamento / Patrimônio (Para emissão de OS)
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 10 }}>
                    <input
                      type="text"
                      className="nesher-filter-select"
                      placeholder="Tag / Patrimônio (ex: PAT-0142)"
                      value={newAssetTag}
                      onChange={(e) => setNewAssetTag(e.target.value)}
                    />
                    <input
                      type="text"
                      className="nesher-filter-select"
                      placeholder="Marca (ex: Dell)"
                      value={newAssetBrand}
                      onChange={(e) => setNewAssetBrand(e.target.value)}
                    />
                    <input
                      type="text"
                      className="nesher-filter-select"
                      placeholder="Modelo (ex: Latitude 3420)"
                      value={newAssetModel}
                      onChange={(e) => setNewAssetModel(e.target.value)}
                    />
                    <input
                      type="text"
                      className="nesher-filter-select"
                      placeholder="Nº Série / Service Tag"
                      value={newAssetSerial}
                      onChange={(e) => setNewAssetSerial(e.target.value)}
                    />
                  </div>
                </div>

                {/* 5. Assunto & Descrição */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Título do Chamado / Problema Relatado *
                  </label>
                  <input
                    type="text"
                    className="nesher-filter-select"
                    style={{ width: '100%' }}
                    placeholder="Ex: Notebook não liga após tempestade"
                    required
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    Detalhamento do Defeito / Observações Técnicas
                  </label>
                  <textarea
                    rows={3}
                    className="nesher-filter-select"
                    style={{ width: '100%', height: 'auto', padding: 10 }}
                    placeholder="Descreva sintomas, mensagens de erro e procedimentos já realizados..."
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />
                </div>

                {/* 6. Observador / Em Cópia (USPDev CC) */}
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                    <i className="ti ti-mail-forward" style={{ marginRight: 6 }} />
                    Observador em Cópia (E-mail adicional para receber notificações)
                  </label>
                  <input
                    type="email"
                    className="nesher-filter-select"
                    style={{ width: '100%' }}
                    placeholder="Ex: gestor@empresa.com.br (opcional)"
                    value={newObserverEmail}
                    onChange={(e) => setNewObserverEmail(e.target.value)}
                  />
                </div>
              </div>

              <footer className="nesher-modal-footer">
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="nesher-btn-primary">
                  <i className="ti ti-check" />
                  <span>Criar Ordem de Serviço</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DRAWER LATERAL: DETALHES COMPLETOS DA ORDEM DE SERVIÇO                 */}
      {/* ========================================================================= */}
      {isDrawerOpen && selectedTicket && (
        <div className="nesher-modal-overlay" onClick={() => setIsDrawerOpen(false)}>
          <div
            className="nesher-modal-card"
            style={{ maxWidth: 840 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <header className="nesher-modal-header" style={{ background: '#f8fafc' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className="nesher-code-badge" style={{ fontSize: 13 }}>{selectedTicket.code}</span>
                  <span className={`nesher-status-badge ${selectedTicket.status.toLowerCase().replace(/\s+/g, '-').normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}>
                    {selectedTicket.status}
                  </span>
                  <span className={`nesher-priority-badge ${selectedTicket.priority.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}`}>
                    {selectedTicket.priority}
                  </span>
                  <span className={`nesher-sla-pill ${selectedTicket.slaStatus}`}>
                    <i className="ti ti-clock" /> {selectedTicket.slaRemaining}
                  </span>
                </div>
                <h2 style={{ marginTop: 8, fontSize: 18 }}>{selectedTicket.subject}</h2>
              </div>

              <button
                type="button"
                className="nesher-modal-close"
                onClick={() => setIsDrawerOpen(false)}
              >
                ✕
              </button>
            </header>

            {/* Drawer Body */}
            <div className="nesher-modal-body" style={{ gap: 18 }}>
              {/* Triage Alert Banner */}
              {selectedTicket.status === 'Em Triagem' && (
                <div className="nesher-triage-banner">
                  <div className="nesher-triage-banner-info">
                    <i className="ti ti-shield-alert" />
                    <div>
                      <strong>Aguardando Homologação de Triagem:</strong>
                      <span style={{ display: 'block', fontSize: 11.5, color: '#6b21a8' }}>
                        Fila com supervisão ativa. Homologue a prioridade e confirme o técnico responsável para liberar o atendimento.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="nesher-btn-primary"
                    style={{ background: '#7e22ce', height: 32, fontSize: 12, padding: '0 12px' }}
                    onClick={() => setIsTriageModalOpen(true)}
                  >
                    <i className="ti ti-check" />
                    <span>Homologar Triagem</span>
                  </button>
                </div>
              )}

              {/* Fila & Transfer Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className={`nesher-queue-badge ${getQueueById(selectedTicket.queueId).color}`}>
                    <i className="ti ti-git-branch" /> {selectedTicket.queueName}
                  </span>
                  <span style={{ fontSize: 11.5, color: '#64748b' }}>
                    SLA: {getQueueById(selectedTicket.queueId).slaResponseHours}h resposta / {getQueueById(selectedTicket.queueId).slaResolutionHours}h resolução
                  </span>
                </div>
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  style={{ height: 28, padding: '0 10px', fontSize: 11.5 }}
                  onClick={() => {
                    setTransferTargetQueueId(selectedTicket.queueId === 'queue-n1' ? 'queue-n2-net' : 'queue-n1');
                    setIsTransferModalOpen(true);
                  }}
                >
                  <i className="ti ti-arrows-exchange" />
                  <span>Transferir Fila</span>
                </button>
              </div>

              {/* Observers Bar */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <strong style={{ fontSize: 12, color: '#334155' }}>
                    <i className="ti ti-users" style={{ marginRight: 4 }} />
                    Em Cópia (Observadores):
                  </strong>
                  {selectedTicket.observers && selectedTicket.observers.length > 0 ? (
                    selectedTicket.observers.map((obs) => (
                      <span key={obs.id} className="nesher-observer-pill">
                        <i className="ti ti-mail" /> {obs.name} ({obs.email})
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: 11.5, color: '#94a3b8' }}>Nenhum observador em cópia</span>
                  )}
                </div>
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  style={{ height: 26, padding: '0 8px', fontSize: 11 }}
                  onClick={() => setIsObserverModalOpen(true)}
                >
                  <i className="ti ti-user-plus" />
                  <span>+ Adicionar</span>
                </button>
              </div>

              {/* Protocolo de Resolução Nesher (Fluxograma: Pode resolver remotamente?) */}
              <div className="nesher-resolution-protocol-card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="nesher-step-badge">Decisão Técnica</span>
                    <strong style={{ fontSize: 12.5, color: '#0f172a' }}>Protocolo de Atendimento</strong>
                  </div>
                  <span style={{ fontSize: 11, color: '#64748b' }}>
                    {selectedTicket.status === 'Resolvido' || selectedTicket.status === 'Fechado'
                      ? '✓ Atendimento Concluído'
                      : 'Triagem & Escalonamento'}
                  </span>
                </div>

                {!selectedTicket.remoteSession && !selectedTicket.fieldVisit && (
                  <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: 8, padding: 12 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#334155' }}>
                      🤔 Este incidente pode ser resolvido remotamente?
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="nesher-btn-remote"
                        onClick={() => setIsRemoteSessionModalOpen(true)}
                      >
                        <i className="ti ti-device-desktop-analytics" />
                        <span>Sim • Iniciar Suporte Remoto</span>
                      </button>

                      <button
                        type="button"
                        className="nesher-btn-field"
                        onClick={() => setIsFieldVisitModalOpen(true)}
                      >
                        <i className="ti ti-calendar-event" />
                        <span>Não • Despachar Visita Presencial</span>
                      </button>
                    </div>
                  </div>
                )}

                {selectedTicket.remoteSession && (
                  <div className="nesher-remote-active-pill">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="ti ti-device-desktop-analytics" style={{ fontSize: 20, color: '#0284c7' }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: 12, color: '#0369a1' }}>
                          Suporte Remoto Autorizado ({selectedTicket.remoteSession.tool})
                        </strong>
                        <small style={{ color: '#0284c7', fontSize: 11 }}>
                          Código de Conexão: <b>{selectedTicket.remoteSession.sessionCode}</b> • Técnico: {selectedTicket.remoteSession.technician}
                        </small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="nesher-pill-action"
                      onClick={() => setIsReportModalOpen(true)}
                    >
                      <i className="ti ti-file-certificate" style={{ marginRight: 4 }} />
                      Registrar Laudo / Solução
                    </button>
                  </div>
                )}

                {selectedTicket.fieldVisit && (
                  <div className="nesher-field-active-pill">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <i className="ti ti-truck" style={{ fontSize: 20, color: '#c2410c' }} />
                      <div>
                        <strong style={{ display: 'block', fontSize: 12, color: '#9a3412' }}>
                          Atendimento Presencial Despachado
                        </strong>
                        <small style={{ color: '#c2410c', fontSize: 11 }}>
                          Técnico: <b>{selectedTicket.fieldVisit.technician}</b> • {selectedTicket.fieldVisit.scheduledDate} ({selectedTicket.fieldVisit.scheduledTime})
                        </small>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="nesher-pill-action"
                      onClick={() => setIsReportModalOpen(true)}
                    >
                      <i className="ti ti-file-certificate" style={{ marginRight: 4 }} />
                      Registrar Laudo / Solução
                    </button>
                  </div>
                )}

                {selectedTicket.technicalReport && (
                  <div className="nesher-report-summary-box">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <strong style={{ fontSize: 12, color: '#166534', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="ti ti-certificate" /> Parecer Técnico &amp; Solução Registrados
                      </strong>
                      {!selectedTicket.clientConfirmation ? (
                        <button
                          type="button"
                          className="nesher-btn-confirm-client"
                          onClick={() => setIsClientConfirmModalOpen(true)}
                        >
                          <i className="ti ti-signature" />
                          <span>Colher Confirmação do Cliente</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#15803d' }}>
                          ✓ Confirmado por {selectedTicket.clientConfirmation.confirmedBy}
                        </span>
                      )}
                    </div>
                    <p style={{ margin: 0, fontSize: 11.5, color: '#14532d', lineHeight: 1.4 }}>
                      <b>Diagnóstico:</b> {selectedTicket.technicalReport.diagnostic} | <b>Solução:</b> {selectedTicket.technicalReport.solution}
                    </p>
                  </div>
                )}
              </div>

              {/* CSAT Rating or Prompt */}
              {selectedTicket.csat ? (
                <div className="nesher-csat-badge" style={{ padding: '8px 14px', width: '100%', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>Avaliação do Cliente:</span>
                    <div className="nesher-csat-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <i key={s} className={s <= (selectedTicket.csat?.score || 0) ? 'ti ti-star-filled' : 'ti ti-star'} />
                      ))}
                    </div>
                    {selectedTicket.csat.comment && (
                      <span style={{ fontStyle: 'italic', color: '#713f12', fontSize: 12 }}>
                        &ldquo;{selectedTicket.csat.comment}&rdquo;
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: 10.5, color: '#a16207' }}>{selectedTicket.csat.ratedAt}</span>
                </div>
              ) : (selectedTicket.status === 'Resolvido' || selectedTicket.status === 'Fechado') ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fefce8', border: '1px solid #fef08a', borderRadius: 8 }}>
                  <span style={{ fontSize: 12, color: '#a16207' }}>
                    ⭐ Atendimento concluído. Registre a nota de satisfação (CSAT) do cliente.
                  </span>
                  <button
                    type="button"
                    className="nesher-btn-secondary"
                    style={{ height: 28, padding: '0 10px', fontSize: 11.5, borderColor: '#fde047' }}
                    onClick={() => setIsCsatModalOpen(true)}
                  >
                    Avaliar Atendimento (CSAT)
                  </button>
                </div>
              ) : null}

              {/* Reopen Warning / Action */}
              {(selectedTicket.status === 'Resolvido' || selectedTicket.status === 'Fechado') && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecdd3', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#991b1b' }}>
                    <i className="ti ti-shield-exclamation" style={{ fontSize: 16 }} />
                    <span>Janela de Garantia (7 dias): Se a falha persistir, o chamado pode ser reaberto.</span>
                  </div>
                  <button
                    type="button"
                    style={{ height: 28, padding: '0 10px', borderRadius: 6, background: '#dc2626', color: '#fff', border: 0, fontWeight: 700, fontSize: 11.5, cursor: 'pointer' }}
                    onClick={() => setIsReopenModalOpen(true)}
                  >
                    <i className="ti ti-rotate" style={{ marginRight: 4 }} />
                    Reabrir Chamado
                  </button>
                </div>
              )}

              {/* Metadata row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: 14, background: '#f8fafc', borderRadius: 8 }}>
                <div>
                  <small style={{ display: 'block', color: '#64748b', fontSize: 11 }}>Empresa Cliente</small>
                  <strong style={{ fontSize: 13 }}>{selectedTicket.company}</strong>
                </div>
                <div>
                  <small style={{ display: 'block', color: '#64748b', fontSize: 11 }}>Solicitante</small>
                  <strong style={{ fontSize: 13 }}>{selectedTicket.requester}</strong>
                </div>
                <div>
                  <small style={{ display: 'block', color: '#64748b', fontSize: 11 }}>Técnico Responsável</small>
                  <strong style={{ fontSize: 13 }}>{selectedTicket.technician}</strong>
                </div>
                <div>
                  <small style={{ display: 'block', color: '#64748b', fontSize: 11 }}>Modalidade</small>
                  <strong style={{ fontSize: 13 }}>{selectedTicket.serviceType}</strong>
                </div>
              </div>

              {/* Asset Details */}
              {selectedTicket.asset && (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                  <strong style={{ display: 'block', fontSize: 13, color: '#1e293b', marginBottom: 8 }}>
                    <i className="ti ti-devices" style={{ marginRight: 6, color: 'var(--blue-600)' }} />
                    Equipamento / Ativo em Atendimento
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 12 }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Tag Patrimônio:</span>{' '}
                      <strong style={{ color: '#2563eb', fontFamily: 'monospace' }}>{selectedTicket.asset.tag || 'Sem Tag'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Tipo / Marca:</span>{' '}
                      <strong>{selectedTicket.asset.type} · {selectedTicket.asset.brand}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Modelo:</span>{' '}
                      <strong>{selectedTicket.asset.model}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Nº de Série:</span>{' '}
                      <strong style={{ fontFamily: 'monospace' }}>{selectedTicket.asset.serial}</strong>
                    </div>
                  </div>
                  {selectedTicket.asset.accessories && (
                    <div style={{ marginTop: 8, fontSize: 11.5, color: '#475569' }}>
                      <strong>Acessórios Deixados:</strong> {selectedTicket.asset.accessories}
                    </div>
                  )}
                </div>
              )}

              {/* Checklist Section */}
              <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 14 }}>
                <strong style={{ display: 'block', fontSize: 13, color: '#1e293b', marginBottom: 10 }}>
                  <i className="ti ti-list-check" style={{ marginRight: 6, color: '#059669' }} />
                  Checklist Técnico Operacional
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedTicket.checklist.map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        fontSize: 13,
                        color: item.done ? '#64748b' : '#1e293b',
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={item.done}
                        onChange={() => handleToggleChecklist(selectedTicket.id, item.id)}
                      />
                      <span style={{ textDecoration: item.done ? 'line-through' : 'none' }}>
                        {item.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Messages & Internal Notes with USPDev Timeline */}
              <div>
                <strong style={{ display: 'block', fontSize: 13, color: '#1e293b', marginBottom: 10 }}>
                  <i className="ti ti-messages" style={{ marginRight: 6, color: 'var(--blue-600)' }} />
                  Histórico e Conversas do Chamado
                </strong>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 260, overflowY: 'auto' }}>
                  {selectedTicket.messages.map((msg) => {
                    if (msg.type === 'system') {
                      return (
                        <div key={msg.id} className="nesher-msg-system">
                          <div className="nesher-msg-system-inner">
                            <i className="ti ti-settings-cog" />
                            <strong>{msg.author}:</strong>
                            <span>{msg.text}</span>
                            <span className="time">({msg.time})</span>
                          </div>
                        </div>
                      );
                    }

                    if (msg.type === 'note') {
                      return (
                        <div key={msg.id} className="nesher-msg-note-box">
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span className="nesher-msg-note-badge">
                                <i className="ti ti-lock" /> NOTA INTERNA (SIGILO TÉCNICO)
                              </span>
                              <strong style={{ fontSize: 12, color: '#b45309' }}>{msg.author}</strong>
                            </div>
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>{msg.time}</span>
                          </div>
                          <p style={{ margin: 0, fontSize: 12.5, color: '#451a03', lineHeight: 1.4 }}>{msg.text}</p>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        style={{
                          padding: '10px 14px',
                          borderRadius: 8,
                          background: msg.type === 'support' ? '#eff6ff' : '#f8fafc',
                          border: msg.type === 'support' ? '1px solid #dbeafe' : '1px solid #e2e8f0',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <strong style={{ fontSize: 12, color: msg.type === 'support' ? '#1e40af' : '#0f172a' }}>
                            {msg.author} {msg.type === 'support' && '· Suporte Nesher'}
                          </strong>
                          <span style={{ fontSize: 11, color: '#94a3b8' }}>{msg.time}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12.5, color: '#334155' }}>{msg.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status Update Quick Action */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#f1f5f9', borderRadius: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#334155' }}>
                  Atualizar Status da OS:
                </span>
                <select
                  className="nesher-filter-select"
                  value={selectedTicket.status}
                  onChange={(e) => handleChangeStatus(selectedTicket.id, e.target.value as TicketStatus)}
                >
                  <option value="Novo">Novo</option>
                  <option value="Em Triagem">Em Triagem</option>
                  <option value="Em Atendimento">Em Atendimento</option>
                  <option value="Aguardando Peças">Aguardando Peças</option>
                  <option value="Aguardando Cliente">Aguardando Cliente</option>
                  <option value="Resolvido">Resolvido</option>
                  <option value="Fechado">Fechado</option>
                </select>
              </div>
            </div>

            {/* Drawer Footer */}
            <footer className="nesher-modal-footer">
              <button
                type="button"
                className="nesher-btn-secondary"
                onClick={() => setIsPrintModalOpen(true)}
              >
                <i className="ti ti-printer" />
                <span>Imprimir OS / Laudo PDF</span>
              </button>

              <button
                type="button"
                className="nesher-btn-primary"
                onClick={() => {
                  handleChangeStatus(selectedTicket.id, 'Resolvido');
                  setIsDrawerOpen(false);
                }}
              >
                <i className="ti ti-circle-check" />
                <span>Concluir Atendimento</span>
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DE IMPRESSÃO / VOUCHER OFICIAL DA ORDEM DE SERVIÇO (FASE 4)      */}
      {/* ========================================================================= */}
      {isPrintModalOpen && selectedTicket && (
        <div className="nesher-modal-overlay" onClick={() => setIsPrintModalOpen(false)}>
          <div
            className="nesher-modal-card"
            style={{ maxWidth: 860, maxHeight: '92vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action Bar (Not printed) */}
            <header className="nesher-modal-header nesher-print-no-print">
              <div>
                <h2 style={{ fontSize: 16 }}>Comprovante Oficial de Ordem de Serviço (PDF)</h2>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Documento formatado para arquivamento, faturamento e assinatura do cliente.
                </span>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="nesher-btn-primary"
                  onClick={() => window.print()}
                >
                  <i className="ti ti-printer" />
                  <span>Imprimir / Salvar PDF</span>
                </button>
                <button
                  type="button"
                  className="nesher-modal-close"
                  onClick={() => setIsPrintModalOpen(false)}
                >
                  ✕
                </button>
              </div>
            </header>

            {/* Printable Document Body */}
            <div className="nesher-modal-body" style={{ background: '#ffffff', padding: 0, overflowY: 'auto' }}>
              <div className="nesher-print-os-document">
                {/* Header */}
                <div className="nesher-print-os-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <strong style={{ fontSize: 20, fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '0.1em', color: '#09254d' }}>
                        NESHER
                      </strong>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', letterSpacing: '0.15em' }}>
                        TECH SOLUTIONS
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
                      <div><b>Razão Social:</b> Nesher Tech Solutions Ltda • CNPJ: 12.345.678/0001-90</div>
                      <div><b>Atendimento & NOC:</b> (11) 3450-8900 • suporte@nesher.com.br</div>
                      <div><b>Portal Corporativo:</b> neshertech.com.br</div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', border: '2px solid #0f172a', padding: '10px 16px', borderRadius: 8 }}>
                    <small style={{ display: 'block', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: '#64748b' }}>
                      ORDEM DE SERVIÇO Nº
                    </small>
                    <strong style={{ fontSize: 22, fontFamily: 'Space Grotesk, monospace', color: '#0f172a' }}>
                      {selectedTicket.code}
                    </strong>
                    <div style={{ fontSize: 11, marginTop: 4, color: '#334155' }}>
                      Status: <b>{selectedTicket.status}</b>
                    </div>
                  </div>
                </div>

                {/* 1. Dados do Cliente */}
                <div className="nesher-print-grid-box">
                  <strong style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', color: '#1e293b', marginBottom: 8 }}>
                    1. Dados da Empresa Cliente & Solicitante
                  </strong>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 10, fontSize: 11.5 }}>
                    <div>
                      <span style={{ color: '#64748b' }}>Razão Social / Fantasia:</span>
                      <strong style={{ display: 'block', color: '#0f172a' }}>{selectedTicket.company}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Solicitante Autorizado:</span>
                      <strong style={{ display: 'block', color: '#0f172a' }}>{selectedTicket.requester}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>Contato / Telefone:</span>
                      <strong style={{ display: 'block', color: '#0f172a' }}>{selectedTicket.requesterPhone}</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Dados do Equipamento / Ativo */}
                <div className="nesher-print-grid-box">
                  <strong style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', color: '#1e293b', marginBottom: 8 }}>
                    2. Equipamento & Ativo Vinculado (GLPI / CMDB)
                  </strong>
                  {selectedTicket.asset ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, fontSize: 11.5 }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Tipo de Ativo:</span>
                        <strong style={{ display: 'block', color: '#0f172a' }}>{selectedTicket.asset.type}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Fabricante / Marca:</span>
                        <strong style={{ display: 'block', color: '#0f172a' }}>{selectedTicket.asset.brand}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Modelo:</span>
                        <strong style={{ display: 'block', color: '#0f172a' }}>{selectedTicket.asset.model}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Nº de Série / Tag:</span>
                        <strong style={{ display: 'block', fontFamily: 'monospace', color: '#0f172a' }}>{selectedTicket.asset.serial}</strong>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11.5, color: '#64748b' }}>
                      Atendimento de software/infraestrutura sem equipamento físico retido.
                    </span>
                  )}
                </div>

                {/* 3. Escopo & Defeito Relatado */}
                <div className="nesher-print-grid-box">
                  <strong style={{ display: 'block', fontSize: 12, textTransform: 'uppercase', color: '#1e293b', marginBottom: 8 }}>
                    3. Defeito Relatado & Procedimentos Executados
                  </strong>
                  <div style={{ fontSize: 12, marginBottom: 10 }}>
                    <strong>Problema Relatado:</strong> {selectedTicket.subject}
                    <p style={{ margin: '4px 0 0', color: '#475569' }}>{selectedTicket.description}</p>
                  </div>

                  {/* Checklist Summary */}
                  <div style={{ marginTop: 12, borderTop: '1px solid #e2e8f0', paddingTop: 10 }}>
                    <strong style={{ display: 'block', fontSize: 11, color: '#334155', marginBottom: 6 }}>
                      Checklist Técnico Realizado:
                    </strong>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {selectedTicket.checklist.map((c) => (
                        <div key={c.id} style={{ fontSize: 11, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, color: c.done ? '#16a34a' : '#64748b' }}>
                            {c.done ? '[X]' : '[ ]'}
                          </span>
                          <span>{c.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 4. Parecer e Garantia */}
                <div style={{ fontSize: 10.5, color: '#64748b', lineHeight: 1.5, marginTop: 20 }}>
                  <p style={{ margin: 0 }}>
                    <b>Termo de Garantia:</b> A Nesher Tech Solutions assegura garantia legal de 90 (noventa) dias a contar
                    desta data para os serviços executados e peças substituídas discriminadas nesta OS. A garantia não cobre danos por
                    descargas atmosféricas, mau uso, violação de lacres ou intervenções de terceiros não autorizados.
                  </p>
                </div>

                {/* 5. Bloco de Assinaturas */}
                <div className="nesher-print-signatures">
                  <div>
                    <div className="nesher-print-sign-line">
                      <strong style={{ display: 'block', fontSize: 12, color: '#0f172a' }}>{selectedTicket.technician}</strong>
                      <span>Técnico Responsável • Nesher Tech Solutions</span>
                    </div>
                  </div>
                  <div>
                    <div className="nesher-print-sign-line">
                      <strong style={{ display: 'block', fontSize: 12, color: '#0f172a' }}>{selectedTicket.requester}</strong>
                      <span>Aceite do Cliente • {selectedTicket.company}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className="nesher-modal-footer nesher-print-no-print">
              <button
                type="button"
                className="nesher-btn-secondary"
                onClick={() => setIsPrintModalOpen(false)}
              >
                Fechar
              </button>
              <button
                type="button"
                className="nesher-btn-primary"
                onClick={() => window.print()}
              >
                <i className="ti ti-printer" />
                <span>Imprimir Agora</span>
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL DE HOMOLOGAÇÃO DE TRIAGEM (INSPIRAÇÃO USPDEV/CHAMADOS)           */}
      {/* ========================================================================= */}
      {isTriageModalOpen && selectedTicket && (
        <div className="nesher-modal-overlay" onClick={() => setIsTriageModalOpen(false)}>
          <div
            className="nesher-modal-card"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="nesher-modal-header">
              <div>
                <h2 style={{ fontSize: 16 }}>Homologação de Triagem • {selectedTicket.code}</h2>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Aprovação de escopo técnico, prioridade e designação de técnico da fila.
                </span>
              </div>
              <button
                type="button"
                className="nesher-modal-close"
                onClick={() => setIsTriageModalOpen(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleTriageSubmit}>
              <div className="nesher-modal-body">
                {/* Context Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: 10,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    fontSize: 12.5,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Fila Designada:</span>
                    <strong style={{ color: '#0284c7' }}>{selectedTicket.queueName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Cliente / Empresa:</span>
                    <strong>{selectedTicket.company}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Solicitante:</span>
                    <span>{selectedTicket.requester}</span>
                  </div>
                  <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: 6, marginTop: 4 }}>
                    <span style={{ color: '#64748b', display: 'block', marginBottom: 2 }}>Assunto:</span>
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{selectedTicket.subject}</span>
                  </div>
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Prioridade Homologada</label>
                  <select
                    className="nesher-form-select"
                    value={triagePriority}
                    onChange={(e) => setTriagePriority(e.target.value as Priority)}
                  >
                    <option value="Baixa">Baixa (Atendimento padrão)</option>
                    <option value="Média">Média (Impacto rotineiro)</option>
                    <option value="Alta">Alta (Operação parcialmente parada)</option>
                    <option value="Urgente">Urgente (Parada crítica total)</option>
                  </select>
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Técnico Responsável na Célula</label>
                  <select
                    className="nesher-form-select"
                    value={triageTechnician}
                    onChange={(e) => setTriageTechnician(e.target.value)}
                  >
                    {getQueueById(selectedTicket.queueId).technicians.map((tech) => (
                      <option key={tech} value={tech}>
                        {tech}
                      </option>
                    ))}
                    <option value="Não Atribuído">Manter Não Atribuído (Fila Aberta)</option>
                  </select>
                </div>

                <div
                  style={{
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 12,
                    color: '#166534',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <i className="ti ti-clock-check" style={{ fontSize: 18 }} />
                  <span>
                    Ao homologar, o status mudará automaticamente para <b>Em Atendimento</b> e o SLA de{' '}
                    <b>{getQueueById(selectedTicket.queueId).slaResolutionHours} horas</b> será auditado.
                  </span>
                </div>
              </div>

              <footer className="nesher-modal-footer">
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  onClick={() => setIsTriageModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="nesher-btn-primary">
                  <i className="ti ti-check" />
                  <span>Homologar e Iniciar Atendimento</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL DE TRANSFERÊNCIA DE FILA (INSPIRAÇÃO USPDEV/CHAMADOS)             */}
      {/* ========================================================================= */}
      {isTransferModalOpen && selectedTicket && (
        <div className="nesher-modal-overlay" onClick={() => setIsTransferModalOpen(false)}>
          <div
            className="nesher-modal-card"
            style={{ maxWidth: 580 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="nesher-modal-header">
              <div>
                <h2 style={{ fontSize: 16 }}>Transferir Fila Especializada • {selectedTicket.code}</h2>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Reencaminhamento técnico com registro obrigatório no histórico de auditoria.
                </span>
              </div>
              <button
                type="button"
                className="nesher-modal-close"
                onClick={() => setIsTransferModalOpen(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleTransferQueueSubmit}>
              <div className="nesher-modal-body">
                <div
                  style={{
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 10,
                    padding: 12,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ color: '#1e40af' }}>Fila Atual do Chamado:</span>
                  <strong style={{ color: '#1d4ed8' }}>{selectedTicket.queueName}</strong>
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Selecione a Nova Fila de Destino *</label>
                  <select
                    className="nesher-form-select"
                    value={transferTargetQueueId}
                    onChange={(e) => setTransferTargetQueueId(e.target.value)}
                  >
                    {serviceQueues.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.name} (SLA: {q.slaResolutionHours}h) {q.requiresTriage ? '• [Requer Triagem]' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {getQueueById(transferTargetQueueId).requiresTriage && (
                  <div
                    style={{
                      background: '#fffbeb',
                      border: '1px solid #fde68a',
                      borderRadius: 8,
                      padding: 10,
                      fontSize: 12,
                      color: '#92400e',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <i className="ti ti-alert-triangle" style={{ fontSize: 16 }} />
                    <span>
                      Esta fila de destino exige homologação do líder técnico. O chamado entrará no estado{' '}
                      <b>Em Triagem</b> para validação da equipe receptora.
                    </span>
                  </div>
                )}

                <div className="nesher-form-group">
                  <label className="nesher-form-label">
                    Justificativa Técnica da Transferência * (Registrada na Auditoria)
                  </label>
                  <textarea
                    className="nesher-form-input"
                    rows={3}
                    placeholder="Ex: Identificado necessidade de troca física de memória RAM em bancada ou configuração de roteador de borda..."
                    value={transferReason}
                    onChange={(e) => setTransferReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <footer className="nesher-modal-footer">
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  onClick={() => setIsTransferModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="nesher-btn-primary"
                  disabled={!transferReason.trim()}
                >
                  <i className="ti ti-arrows-left-right" />
                  <span>Confirmar Transferência</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL DE ADICIONAR OBSERVADOR EM CÓPIA (INSPIRAÇÃO USPDEV/CHAMADOS)     */}
      {/* ========================================================================= */}
      {isObserverModalOpen && selectedTicket && (
        <div className="nesher-modal-overlay" onClick={() => setIsObserverModalOpen(false)}>
          <div
            className="nesher-modal-card"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="nesher-modal-header">
              <div>
                <h2 style={{ fontSize: 16 }}>Adicionar Observador • {selectedTicket.code}</h2>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Notificar terceiros, diretores ou interessados em cópia das atualizações.
                </span>
              </div>
              <button
                type="button"
                className="nesher-modal-close"
                onClick={() => setIsObserverModalOpen(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleAddObserver}>
              <div className="nesher-modal-body">
                {selectedTicket.observers && selectedTicket.observers.length > 0 && (
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                      Observadores Atuais ({selectedTicket.observers.length})
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                      {selectedTicket.observers.map((obs) => (
                        <div
                          key={obs.id}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '4px 8px',
                            fontSize: 11.5,
                            color: '#334155',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          <i className="ti ti-user" />
                          <b>{obs.name}</b>
                          <span style={{ color: '#64748b' }}>({obs.email})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Nome Completo do Observador *</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    placeholder="Ex: Carlos Mendes (Gerente TI)"
                    value={observerNameInput}
                    onChange={(e) => setObserverNameInput(e.target.value)}
                    required
                  />
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">E-mail para Recebimento de Atualizações *</label>
                  <input
                    type="email"
                    className="nesher-form-input"
                    placeholder="Ex: carlos.mendes@cliente.com.br"
                    value={observerEmailInput}
                    onChange={(e) => setObserverEmailInput(e.target.value)}
                    required
                  />
                </div>

                <p style={{ margin: 0, fontSize: 11.5, color: '#64748b', lineHeight: 1.4 }}>
                  <i className="ti ti-info-circle" style={{ marginRight: 4 }} />
                  Observadores recebem notificações automáticas de mudança de status, pareceres técnicos e encerramento
                  do chamado, garantindo visibilidade para stakeholders.
                </p>
              </div>

              <footer className="nesher-modal-footer">
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  onClick={() => setIsObserverModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="nesher-btn-primary">
                  <i className="ti ti-user-plus" />
                  <span>Adicionar em Cópia</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL DE PESQUISA DE SATISFAÇÃO CSAT (INSPIRAÇÃO USPDEV/CHAMADOS)     */}
      {/* ========================================================================= */}
      {isCsatModalOpen && selectedTicket && (
        <div className="nesher-modal-overlay" onClick={() => setIsCsatModalOpen(false)}>
          <div
            className="nesher-modal-card"
            style={{ maxWidth: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="nesher-modal-header">
              <div>
                <h2 style={{ fontSize: 16 }}>Pesquisa de Satisfação (CSAT) • {selectedTicket.code}</h2>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Avalie a resolução do seu chamado pela Nesher Tech Solutions.
                </span>
              </div>
              <button
                type="button"
                className="nesher-modal-close"
                onClick={() => setIsCsatModalOpen(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleCsatSubmit}>
              <div className="nesher-modal-body" style={{ textAlign: 'center', padding: '24px 20px' }}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: 13, color: '#475569', display: 'block' }}>
                    Como você avalia a velocidade e eficácia do atendimento prestado por:
                  </span>
                  <strong style={{ fontSize: 15, color: '#0f172a' }}>
                    {selectedTicket.technician} ({selectedTicket.queueName})
                  </strong>
                </div>

                {/* Star Rating selector */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 10, margin: '14px 0' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setCsatScoreInput(star)}
                      style={{
                        background: 'transparent',
                        border: 0,
                        cursor: 'pointer',
                        fontSize: 34,
                        color: star <= csatScoreInput ? '#f59e0b' : '#cbd5e1',
                        transition: 'transform 0.15s ease, color 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                      title={`${star} estrela${star > 1 ? 's' : ''}`}
                    >
                      ★
                    </button>
                  ))}
                </div>

                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: csatScoreInput >= 4 ? '#16a34a' : csatScoreInput === 3 ? '#d97706' : '#dc2626',
                    marginBottom: 16,
                  }}
                >
                  {csatScoreInput === 5 && '★★★★★ Excelente! Superou as expectativas'}
                  {csatScoreInput === 4 && '★★★★☆ Muito Bom! Atendimento eficaz'}
                  {csatScoreInput === 3 && '★★★☆☆ Regular / Atendeu aos requisitos'}
                  {csatScoreInput === 2 && '★★☆☆☆ Ruim / Houve demoras ou pendências'}
                  {csatScoreInput === 1 && '★☆☆☆☆ Insatisfeito / Problema não resolvido'}
                </div>

                <div className="nesher-form-group" style={{ textAlign: 'left' }}>
                  <label className="nesher-form-label">Comentário ou Sugestão de Melhoria (Opcional)</label>
                  <textarea
                    className="nesher-form-input"
                    rows={3}
                    placeholder="Conte como foi sua experiência, elogios ao técnico ou o que podemos melhorar..."
                    value={csatCommentInput}
                    onChange={(e) => setCsatCommentInput(e.target.value)}
                  />
                </div>
              </div>

              <footer className="nesher-modal-footer">
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  onClick={() => setIsCsatModalOpen(false)}
                >
                  Pular Avaliação
                </button>
                <button type="submit" className="nesher-btn-primary">
                  <i className="ti ti-star" />
                  <span>Enviar Avaliação</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. MODAL DE REABERTURA DE CHAMADO (INSPIRAÇÃO USPDEV/CHAMADOS)           */}
      {/* ========================================================================= */}
      {isReopenModalOpen && selectedTicket && (
        <div className="nesher-modal-overlay" onClick={() => setIsReopenModalOpen(false)}>
          <div
            className="nesher-modal-card"
            style={{ maxWidth: 540 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="nesher-modal-header">
              <div>
                <h2 style={{ fontSize: 16 }}>Reabrir Chamado em Garantia • {selectedTicket.code}</h2>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Reativação de chamado resolvido com notificação prioritária à equipe técnica.
                </span>
              </div>
              <button
                type="button"
                className="nesher-modal-close"
                onClick={() => setIsReopenModalOpen(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleReopenSubmit}>
              <div className="nesher-modal-body">
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 12,
                    color: '#991b1b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <i className="ti ti-alert-triangle" style={{ fontSize: 18 }} />
                  <span>
                    A reabertura reativa o chamado para <b>Em Atendimento</b> na fila{' '}
                    <b>{selectedTicket.queueName}</b> e registra o motivo no histórico oficial.
                  </span>
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">
                    Motivo da Reabertura / Falha Recorrente *
                  </label>
                  <textarea
                    className="nesher-form-input"
                    rows={4}
                    placeholder="Descreva detalhadamente o sintoma que reapareceu ou o motivo pelo qual o problema persiste após a conclusão técnica..."
                    value={reopenReasonInput}
                    onChange={(e) => setReopenReasonInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <footer className="nesher-modal-footer">
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  onClick={() => setIsReopenModalOpen(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="nesher-btn-primary"
                  style={{ background: '#dc2626', borderColor: '#b91c1c' }}
                  disabled={!reopenReasonInput.trim()}
                >
                  <i className="ti ti-rotate" />
                  <span>Confirmar Reabertura</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 12. MODAL DE SUPORTE REMOTO (FLUXOGRAMA: PODE RESOLVER REMOTAMENTE? -> SIM) */}
      {/* ========================================================================= */}
      {isRemoteSessionModalOpen && selectedTicket && (
        <div className="nesher-modal-overlay" onClick={() => setIsRemoteSessionModalOpen(false)}>
          <div className="nesher-modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <header className="nesher-modal-header">
              <div>
                <h2 style={{ fontSize: 16 }}>Iniciar Suporte Remoto • {selectedTicket.code}</h2>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Conexão assistida direta na máquina do cliente com registro em auditoria.
                </span>
              </div>
              <button
                type="button"
                className="nesher-modal-close"
                onClick={() => setIsRemoteSessionModalOpen(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleStartRemoteSessionSubmit}>
              <div className="nesher-modal-body">
                <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: 12, fontSize: 12.5, color: '#0369a1' }}>
                  <i className="ti ti-info-circle" style={{ marginRight: 6 }} />
                  Solicitante: <b>{selectedTicket.requester}</b> ({selectedTicket.company}) • Técnico: <b>{selectedTicket.technician}</b>
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Software de Acesso Remoto *</label>
                  <select
                    className="nesher-form-select"
                    value={remoteTool}
                    onChange={(e) => setRemoteTool(e.target.value as any)}
                  >
                    <option value="RustDesk">RustDesk (Nativo Nesher - Alta Performance)</option>
                    <option value="AnyDesk">AnyDesk Corporativo</option>
                    <option value="TeamViewer">TeamViewer Enterprise</option>
                    <option value="QuickAssist">Assistência Rápida (Windows Quick Assist)</option>
                  </select>
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Código da Sessão / ID de Acesso *</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      className="nesher-form-input"
                      value={remoteSessionCode}
                      onChange={(e) => setRemoteSessionCode(e.target.value)}
                      placeholder="Ex: NESH-8942 ou 992 481 021"
                      required
                    />
                    <button
                      type="button"
                      className="nesher-btn-secondary"
                      onClick={() => setRemoteSessionCode(`NESH-${Math.floor(1000 + Math.random() * 9000)}`)}
                      style={{ whiteSpace: 'nowrap', fontSize: 11 }}
                    >
                      Gerar Código
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#334155' }}>
                  <input type="checkbox" id="consent" defaultChecked required />
                  <label htmlFor="consent">
                    O solicitante ({selectedTicket.requester}) autorizou o início da sessão remota.
                  </label>
                </div>
              </div>

              <footer className="nesher-modal-footer">
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  onClick={() => setIsRemoteSessionModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="nesher-btn-primary" style={{ background: '#0284c7', borderColor: '#0369a1' }}>
                  <i className="ti ti-device-desktop-analytics" />
                  <span>Autorizar e Iniciar Conexão</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 13. MODAL DE VISITA PRESENCIAL (FLUXOGRAMA: PODE RESOLVER REMOTAMENTE? -> NÃO) */}
      {/* ========================================================================= */}
      {isFieldVisitModalOpen && selectedTicket && (
        <div className="nesher-modal-overlay" onClick={() => setIsFieldVisitModalOpen(false)}>
          <div className="nesher-modal-card" style={{ maxWidth: 580 }} onClick={(e) => e.stopPropagation()}>
            <header className="nesher-modal-header">
              <div>
                <h2 style={{ fontSize: 16 }}>Despachar Visita Presencial (On-Site) • {selectedTicket.code}</h2>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Agendamento de visita física e sincronização direta com a Agenda Técnica.
                </span>
              </div>
              <button
                type="button"
                className="nesher-modal-close"
                onClick={() => setIsFieldVisitModalOpen(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleScheduleFieldVisitSubmit}>
              <div className="nesher-modal-body">
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: 12, fontSize: 12.5, color: '#9a3412' }}>
                  <i className="ti ti-truck" style={{ marginRight: 6 }} />
                  Escalonamento On-Site: Incidente requer intervenção física nas dependências de <b>{selectedTicket.company}</b>.
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Técnico de Campo Responsável *</label>
                  <select
                    className="nesher-form-select"
                    value={fieldTech}
                    onChange={(e) => setFieldTech(e.target.value)}
                  >
                    <option value="Lucas Silva">Lucas Silva (Especialista em Redes &amp; Hardware)</option>
                    <option value="Diego Ferreira">Diego Ferreira (Técnico de Manutenção On-Site)</option>
                    <option value="Mariana Costa">Mariana Costa (Service Desk &amp; Infra)</option>
                    <option value="Carlos Eduardo">Carlos Eduardo (Líder Técnico N2)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="nesher-form-group">
                    <label className="nesher-form-label">Data Prevista da Visita *</label>
                    <input
                      type="text"
                      className="nesher-form-input"
                      value={fieldDate}
                      onChange={(e) => setFieldDate(e.target.value)}
                      placeholder="Ex: Amanhã ou 15/09/2026"
                      required
                    />
                  </div>

                  <div className="nesher-form-group">
                    <label className="nesher-form-label">Janela de Horário *</label>
                    <select
                      className="nesher-form-select"
                      value={fieldTime}
                      onChange={(e) => setFieldTime(e.target.value)}
                    >
                      <option value="09:00 - 11:30">Manhã (09:00 - 11:30)</option>
                      <option value="13:30 - 16:00">Tarde (13:30 - 16:00)</option>
                      <option value="16:00 - 18:30">Fim de Tarde (16:00 - 18:30)</option>
                      <option value="Plantão Noturno">Plantão Noturno / Emergência</option>
                    </select>
                  </div>
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Endereço / Sala / Setor *</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={fieldAddress}
                    onChange={(e) => setFieldAddress(e.target.value)}
                    placeholder={`Ex: Av. Paulista, 1000 - 4º Andar (Sede ${selectedTicket.company})`}
                    required
                  />
                </div>
              </div>

              <footer className="nesher-modal-footer">
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  onClick={() => setIsFieldVisitModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="nesher-btn-primary" style={{ background: '#ea580c', borderColor: '#c2410c' }}>
                  <i className="ti ti-calendar-plus" />
                  <span>Confirmar e Despachar Visita</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 14. MODAL DE REGISTRO DE LAUDO TÉCNICO & SOLUÇÃO                         */}
      {/* ========================================================================= */}
      {isReportModalOpen && selectedTicket && (
        <div className="nesher-modal-overlay" onClick={() => setIsReportModalOpen(false)}>
          <div className="nesher-modal-card" style={{ maxWidth: 620 }} onClick={(e) => e.stopPropagation()}>
            <header className="nesher-modal-header">
              <div>
                <h2 style={{ fontSize: 16 }}>Registrar Laudo Técnico &amp; Solução • {selectedTicket.code}</h2>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Registro do diagnóstico e solução aplicada para emissão de voucher e garantia legal.
                </span>
              </div>
              <button
                type="button"
                className="nesher-modal-close"
                onClick={() => setIsReportModalOpen(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleSaveReportSubmit}>
              <div className="nesher-modal-body">
                <div className="nesher-form-group">
                  <label className="nesher-form-label">Diagnóstico Técnico (Causa Raiz) *</label>
                  <textarea
                    className="nesher-form-input"
                    rows={2}
                    value={reportDiagnostic}
                    onChange={(e) => setReportDiagnostic(e.target.value)}
                    placeholder="Ex: Identificado travamento por superaquecimento e falha no cooler do processador..."
                    required
                  />
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Solução Técnica Executada *</label>
                  <textarea
                    className="nesher-form-input"
                    rows={3}
                    value={reportSolution}
                    onChange={(e) => setReportSolution(e.target.value)}
                    placeholder="Ex: Substituição da pasta térmica, limpeza interna, troca do cooler e teste sob carga..."
                    required
                  />
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Recomendações Preventivas ao Cliente</label>
                  <textarea
                    className="nesher-form-input"
                    rows={2}
                    value={reportRecommendations}
                    onChange={(e) => setReportRecommendations(e.target.value)}
                    placeholder="Ex: Manter saídas de ar desobstruídas e realizar limpeza preventiva a cada 6 meses."
                  />
                </div>
              </div>

              <footer className="nesher-modal-footer">
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  onClick={() => setIsReportModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="nesher-btn-primary">
                  <i className="ti ti-file-certificate" />
                  <span>Salvar Parecer Técnico</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 15. MODAL DE CONFIRMAÇÃO & ACEITE DO CLIENTE                              */}
      {/* ========================================================================= */}
      {isClientConfirmModalOpen && selectedTicket && (
        <div className="nesher-modal-overlay" onClick={() => setIsClientConfirmModalOpen(false)}>
          <div className="nesher-modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
            <header className="nesher-modal-header">
              <div>
                <h2 style={{ fontSize: 16 }}>Confirmação &amp; Aceite do Cliente • {selectedTicket.code}</h2>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                  Validação formal do encerramento da Ordem de Serviço pelo solicitante.
                </span>
              </div>
              <button
                type="button"
                className="nesher-modal-close"
                onClick={() => setIsClientConfirmModalOpen(false)}
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleClientConfirmSubmit}>
              <div className="nesher-modal-body">
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 12, fontSize: 12.5, color: '#166534' }}>
                  <i className="ti ti-circle-check" style={{ marginRight: 6 }} />
                  Ao confirmar, o chamado será marcado como <b>Resolvido</b> com garantia legal de 90 dias assegurada.
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Nome do Responsável pelo Aceite *</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={confirmClientName || selectedTicket.requester}
                    onChange={(e) => setConfirmClientName(e.target.value)}
                    required
                  />
                </div>

                <div className="nesher-form-group">
                  <label className="nesher-form-label">Método de Validação</label>
                  <select
                    className="nesher-form-select"
                    value={confirmMethod}
                    onChange={(e) => setConfirmMethod(e.target.value as any)}
                  >
                    <option value="Portal do Cliente">Portal do Cliente (Validação Online)</option>
                    <option value="Assinatura Presencial">Assinatura Presencial Coletada em Campo</option>
                    <option value="Digital">Aceite Digital por E-mail / WhatsApp</option>
                  </select>
                </div>

                <p style={{ margin: 0, fontSize: 11.5, color: '#64748b', lineHeight: 1.4 }}>
                  <i className="ti ti-shield-check" style={{ marginRight: 4 }} />
                  A confirmação formal gera registro com data e hora na auditoria oficial do atendimento.
                </p>
              </div>

              <footer className="nesher-modal-footer">
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  onClick={() => setIsClientConfirmModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="nesher-btn-primary" style={{ background: '#16a34a', borderColor: '#15803d' }}>
                  <i className="ti ti-circle-check" />
                  <span>Confirmar e Concluir Chamado</span>
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


