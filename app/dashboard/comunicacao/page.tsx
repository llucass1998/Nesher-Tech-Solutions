'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { isGlobalAdmin, isClientUser } from '@/app/lib/auth-rbac';

export interface ChatMessage {
  id: string;
  sender: 'client' | 'agent' | 'system';
  author: string;
  text: string;
  time: string;
}

export interface ConversationItem {
  id: string;
  ticketId?: string;
  clientName: string;
  company: string;
  companyInitials?: string;
  companyColor?: string;
  ticketProtocol?: string;
  subject: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: ChatMessage[];
}

interface CompanyOption {
  id: string;
  name: string;
  contact: string;
  color: string;
}

const defaultCompanyOptions: CompanyOption[] = [
  { id: 'comp-1', name: 'LogiFlow Transportes', contact: 'Roberto Silva', color: '#2563eb' },
  { id: 'comp-2', name: 'Hospital São Lucas', contact: 'Dra. Camila Duarte', color: '#0d9488' },
  { id: 'comp-3', name: 'Distribuidora Express & Cargas', contact: 'Marcos Oliveira', color: '#d97706' },
  { id: 'comp-4', name: 'Rede Varejo Mais', contact: 'Juliana Mendes', color: '#7c3aed' },
];

const seedConversations: ConversationItem[] = [
  {
    id: 'conv-logiflow-1',
    ticketId: 'tkt-1',
    clientName: 'Roberto Silva',
    company: 'LogiFlow Transportes',
    companyInitials: 'LF',
    companyColor: '#2563eb',
    ticketProtocol: 'NS-2026-0031',
    subject: 'Lentidão no switch principal do CPD',
    lastMessage: 'Técnico a caminho para substituição do patch cord.',
    time: '14:22',
    unread: 0,
    messages: [
      { id: 'm1', sender: 'client', author: 'Roberto Silva (LogiFlow)', text: 'Boa tarde, notamos que a rede interna do setor fiscal caiu.', time: '14:15' },
      { id: 'm2', sender: 'agent', author: 'Nesher Tech (Admin Global)', text: 'Boa tarde Roberto, estamos analisando o tráfego do switch agora.', time: '14:18' },
      { id: 'm3', sender: 'agent', author: 'Nesher Tech (Admin Global)', text: 'Técnico a caminho para substituição do patch cord.', time: '14:22' },
    ],
  },
  {
    id: 'conv-saolucas-1',
    ticketId: 'tkt-2',
    clientName: 'Dra. Camila Duarte',
    company: 'Hospital São Lucas',
    companyInitials: 'SL',
    companyColor: '#0d9488',
    ticketProtocol: 'NS-2026-0045',
    subject: 'Configuração de VLAN e porta 8080 para Tomógrafo',
    lastMessage: 'Testado e funcionando perfeitamente! Muito obrigada pelo suporte rápido.',
    time: '11:40',
    unread: 0,
    messages: [
      { id: 'm4', sender: 'client', author: 'Dra. Camila (Hospital São Lucas)', text: 'Olá equipe Nesher! Precisamos liberar a porta 8080 para o novo tomógrafo da Siemens na UTI.', time: '11:10' },
      { id: 'm5', sender: 'agent', author: 'Nesher Tech (Admin Global)', text: 'Olá Dra. Camila! Regra criada no firewall e tráfego liberado na VLAN 20 do hospital. Pode realizar o teste?', time: '11:28' },
      { id: 'm6', sender: 'client', author: 'Dra. Camila (Hospital São Lucas)', text: 'Testado e funcionando perfeitamente! Muito obrigada pelo suporte rápido.', time: '11:40' },
    ],
  },
  {
    id: 'conv-express-1',
    ticketId: 'tkt-3',
    clientName: 'Marcos Oliveira',
    company: 'Distribuidora Express & Cargas',
    companyInitials: 'EX',
    companyColor: '#d97706',
    ticketProtocol: 'NS-2026-0052',
    subject: 'Certificado digital A1 e túnel VPN para filial Campinas',
    lastMessage: 'Túnel IPsec ativado. Seguem as credenciais no cofre seguro.',
    time: '09:15',
    unread: 1,
    messages: [
      { id: 'm7', sender: 'client', author: 'Marcos Oliveira (Distribuidora Express)', text: 'Bom dia! Estamos inaugurando a filial de Campinas e precisamos interligar os sistemas via VPN.', time: '08:50' },
      { id: 'm8', sender: 'agent', author: 'Nesher Tech (Admin Global)', text: 'Bom dia Marcos! Configurações do túnel IPsec geradas e ativadas no roteador central.', time: '09:12' },
      { id: 'm9', sender: 'agent', author: 'Nesher Tech (Admin Global)', text: 'Túnel IPsec ativado. Seguem as credenciais no cofre seguro.', time: '09:15' },
    ],
  },
  {
    id: 'conv-varejo-1',
    ticketId: 'tkt-4',
    clientName: 'Juliana Mendes',
    company: 'Rede Varejo Mais',
    companyInitials: 'VM',
    companyColor: '#7c3aed',
    ticketProtocol: 'NS-2026-0060',
    subject: 'Manutenção preventiva dos 8 PDVs de caixas',
    lastMessage: 'Confirmadíssimo Juliana! Técnico Lucas estará no local às 19h45.',
    time: 'Ontem',
    unread: 0,
    messages: [
      { id: 'm10', sender: 'client', author: 'Juliana Mendes (Rede Varejo Mais)', text: 'Boa tarde! Confirmando o agendamento da manutenção preventiva dos caixas para hoje após o fechamento.', time: '16:30' },
      { id: 'm11', sender: 'agent', author: 'Nesher Tech (Admin Global)', text: 'Confirmadíssimo Juliana! Técnico Lucas estará no local às 19h45.', time: '16:45' },
    ],
  },
];

export default function ComunicacaoPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [simulatedRole, setSimulatedRole] = useState<string>('');
  const [conversations, setConversations] = useState<ConversationItem[]>(seedConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string>('conv-logiflow-1');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [mobileTab, setMobileTab] = useState<'list' | 'chat'>('list');
  const [newMessage, setNewMessage] = useState<string>('');
  const [companiesList, setCompaniesList] = useState<CompanyOption[]>(defaultCompanyOptions);
  
  // Modal state for starting a new conversation
  const [isNewConvModalOpen, setIsNewConvModalOpen] = useState(false);
  const [newConvCompany, setNewConvCompany] = useState('');
  const [newConvContact, setNewConvContact] = useState('');
  const [newConvSubject, setNewConvSubject] = useState('');
  const [newConvInitialMsg, setNewConvInitialMsg] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user session & simulated role
  useEffect(() => {
    try {
      const rawUser = window.localStorage.getItem('logiflow_user');
      if (rawUser) setCurrentUser(JSON.parse(rawUser));

      const rawRole = window.localStorage.getItem('nesher_simulated_role');
      if (rawRole) setSimulatedRole(rawRole);
    } catch {}
  }, []);

  // Compute RBAC
  const activeRoles = useMemo(() => {
    if (simulatedRole) {
      if (simulatedRole === 'client') return ['ROLE_CLIENT', 'CUSTOMER'];
      if (simulatedRole === 'tech') return ['ROLE_TECH', 'OPERATOR'];
      return ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'ADMIN'];
    }
    if (currentUser?.roles && Array.isArray(currentUser.roles) && currentUser.roles.length > 0) {
      return currentUser.roles;
    }
    return ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'ADMIN'];
  }, [simulatedRole, currentUser]);

  const userIsAdmin = isGlobalAdmin(activeRoles);
  const userIsClient = isClientUser(activeRoles);
  const clientCompany = currentUser?.companyName || 'LogiFlow Transportes';

  // Load companies from localStorage (nesher_companies)
  useEffect(() => {
    try {
      const rawCompanies = window.localStorage.getItem('nesher_companies');
      if (rawCompanies) {
        const parsed = JSON.parse(rawCompanies);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const colors = ['#2563eb', '#0d9488', '#d97706', '#7c3aed', '#ec4899', '#059669', '#3b82f6'];
          const mapped: CompanyOption[] = parsed.map((c: any, idx: number) => ({
            id: c.id || `comp-${idx}`,
            name: c.tradeName || c.corporateName || 'Empresa',
            contact: c.managerName || 'Responsável',
            color: colors[idx % colors.length],
          }));
          setCompaniesList(mapped);
          if (mapped.length > 0 && !newConvCompany) {
            setNewConvCompany(mapped[0].name);
            setNewConvContact(mapped[0].contact);
          }
        }
      } else {
        setNewConvCompany(defaultCompanyOptions[0].name);
        setNewConvContact(defaultCompanyOptions[0].contact);
      }
    } catch {}
  }, []);

  // Load / hydrate conversations from localStorage
  useEffect(() => {
    try {
      const rawConversations = window.localStorage.getItem('nesher_conversations');
      if (rawConversations) {
        const parsed = JSON.parse(rawConversations);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setConversations(parsed);
          return;
        }
      }

      // If no stored conversations yet, save the seed conversations
      window.localStorage.setItem('nesher_conversations', JSON.stringify(seedConversations));
    } catch {}
  }, []);

  // Scroll to bottom on conversation change or new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedConversationId, conversations]);

  // Multi-tenant conversation list filtering
  const visibleConversations = useMemo(() => {
    let list = [...conversations];

    // CRITICAL MULTI-TENANT ISOLATION:
    // If the user is a Client, they can ONLY see conversations belonging strictly to their company!
    // "as empresas n conversão entre sí só com o admin global"
    if (userIsClient) {
      list = list.filter(
        (c) => c.company.toLowerCase().trim() === clientCompany.toLowerCase().trim()
      );
    } else if (companyFilter !== 'all') {
      // Admin filter by specific company
      list = list.filter(
        (c) => c.company.toLowerCase().trim() === companyFilter.toLowerCase().trim()
      );
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.company.toLowerCase().includes(q) ||
          c.clientName.toLowerCase().includes(q) ||
          (c.ticketProtocol && c.ticketProtocol.toLowerCase().includes(q)) ||
          c.subject.toLowerCase().includes(q) ||
          c.lastMessage.toLowerCase().includes(q)
      );
    }

    return list;
  }, [conversations, userIsClient, clientCompany, companyFilter, searchTerm]);

  // Selected Active Conversation
  const activeConv = useMemo(() => {
    const found = visibleConversations.find((c) => c.id === selectedConversationId);
    return found || visibleConversations[0] || null;
  }, [visibleConversations, selectedConversationId]);

  // Ensure active conversation matches available list
  useEffect(() => {
    if (visibleConversations.length > 0) {
      const exists = visibleConversations.some((c) => c.id === selectedConversationId);
      if (!exists) {
        setSelectedConversationId(visibleConversations[0].id);
      }
    }
  }, [visibleConversations, selectedConversationId]);

  // Handle Send Message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgText = newMessage.trim();

    const senderType = userIsClient ? ('client' as const) : ('agent' as const);
    const authorName = userIsClient
      ? `${currentUser?.name || activeConv.clientName} (${activeConv.company})`
      : 'Nesher Tech (Admin Global)';

    const newChatMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender: senderType,
      author: authorName,
      text: msgText,
      time: timeStr,
    };

    const updated = conversations.map((c) => {
      if (c.id !== activeConv.id) return c;
      return {
        ...c,
        lastMessage: msgText,
        time: timeStr,
        messages: [...c.messages, newChatMsg],
      };
    });

    setConversations(updated);
    setNewMessage('');

    try {
      window.localStorage.setItem('nesher_conversations', JSON.stringify(updated));
      window.dispatchEvent(new Event('nesher_conversations_changed'));

      // If linked to a ticket, also update nesher_tickets
      if (activeConv.ticketId) {
        const rawTickets = window.localStorage.getItem('nesher_tickets');
        if (rawTickets) {
          const tickets = JSON.parse(rawTickets);
          const updatedTickets = tickets.map((t: any) => {
            if (t.id !== activeConv.ticketId) return t;
            return {
              ...t,
              messages: [
                ...(t.messages || []),
                {
                  id: Date.now(),
                  author: authorName,
                  text: msgText,
                  time: timeStr,
                  type: userIsClient ? 'client' : 'support',
                },
              ],
            };
          });
          window.localStorage.setItem('nesher_tickets', JSON.stringify(updatedTickets));
        }
      }
    } catch {}
  };

  // Create New Conversation
  const handleCreateNewConversation = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCompany = userIsClient ? clientCompany : newConvCompany;
    const targetContact = userIsClient ? (currentUser?.name || 'Solicitante') : (newConvContact || 'Contato da Empresa');
    const targetSubject = newConvSubject.trim() || (userIsClient ? 'Atendimento Geral Suporte' : 'Canal Direto com Administrador Global');
    const initialText = newConvInitialMsg.trim() || 'Olá, canal de comunicação iniciado.';

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newId = 'conv-' + Date.now();

    const matchedComp = companiesList.find((co) => co.name === targetCompany);
    const initials = targetCompany.split(' ').filter(Boolean).slice(0, 2).map((p: string) => p[0].toUpperCase()).join('') || 'EP';

    const newConv: ConversationItem = {
      id: newId,
      ticketProtocol: `NS-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      clientName: targetContact,
      company: targetCompany,
      companyInitials: initials,
      companyColor: matchedComp?.color || '#0b68d1',
      subject: targetSubject,
      lastMessage: initialText,
      time: timeStr,
      unread: 0,
      messages: [
        {
          id: 'msg-' + Date.now(),
          sender: userIsClient ? 'client' : 'agent',
          author: userIsClient ? `${targetContact} (${targetCompany})` : 'Nesher Tech (Admin Global)',
          text: initialText,
          time: timeStr,
        },
      ],
    };

    const updated = [newConv, ...conversations];
    setConversations(updated);
    setSelectedConversationId(newId);
    setIsNewConvModalOpen(false);
    setNewConvSubject('');
    setNewConvInitialMsg('');
    setMobileTab('chat');

    try {
      window.localStorage.setItem('nesher_conversations', JSON.stringify(updated));
      window.dispatchEvent(new Event('nesher_conversations_changed'));
    } catch {}
  };

  return (
    <div className="nesher-dashboard">
      {/* Header Row */}
      <div className="nesher-welcome-row" style={{ alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: '6px',
                background: userIsAdmin ? '#eff6ff' : '#ecfdf5',
                color: userIsAdmin ? '#1d4ed8' : '#047857',
                border: userIsAdmin ? '1px solid #bfdbfe' : '1px solid #a7f3d0',
              }}
            >
              {userIsAdmin ? '🛡️ Central do Administrador Global' : `🏢 Canal Exclusivo: ${clientCompany}`}
            </span>
          </div>
          <h1 style={{ margin: 0 }}>Central de Conversas &amp; Chat</h1>
          <p className="nesher-welcome-copy" style={{ margin: '4px 0 0' }}>
            {userIsAdmin
              ? 'Converse diretamente em tempo real com todas as empresas cadastradas no sistema. As empresas não se comunicam entre si.'
              : `Canal direto e seguro para falar com a equipe de suporte do Administrador Global da Nesher Tech.`}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="nesher-primary-button"
            onClick={() => setIsNewConvModalOpen(true)}
            style={{ fontWeight: 700, fontSize: '12px' }}
          >
            <i className="ti ti-message-plus" />
            <span>{userIsAdmin ? 'Nova Conversa com Empresa' : 'Nova Mensagem para o Suporte'}</span>
          </button>

          <Link href="/dashboard/respostas-rapidas" className="nesher-select" style={{ fontWeight: 700, fontSize: '12px' }}>
            <i className="ti ti-bolt" /> Modelos Rápidos
          </Link>
        </div>
      </div>

      {/* Multi-Tenant Notice Banner for Clients */}
      {userIsClient && (
        <div
          style={{
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '10px 16px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            color: '#166534',
          }}
        >
          <i className="ti ti-shield-lock" style={{ fontSize: '18px', color: '#15803d' }} />
          <div>
            <strong>Canal Exclusivo &amp; Criptografado:</strong> Sua empresa (<strong>{clientCompany}</strong>) conversa exclusivamente com a equipe do Administrador Global da Nesher Tech Solutions. Nenhuma outra empresa possui acesso a essas conversas.
          </div>
        </div>
      )}

      {/* Admin Company Filter Bar */}
      {userIsAdmin && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '10px 14px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            <i className="ti ti-building" /> Empresas no Sistema:
          </span>

          <button
            type="button"
            onClick={() => setCompanyFilter('all')}
            style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              border: companyFilter === 'all' ? '1px solid #0b68d1' : '1px solid #cbd5e1',
              background: companyFilter === 'all' ? '#0b68d1' : '#f8fafc',
              color: companyFilter === 'all' ? '#ffffff' : '#334155',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            Todas as Empresas ({conversations.length})
          </button>

          {companiesList.map((comp) => {
            const count = conversations.filter((c) => c.company.toLowerCase().trim() === comp.name.toLowerCase().trim()).length;
            const isSelected = companyFilter.toLowerCase().trim() === comp.name.toLowerCase().trim();
            return (
              <button
                key={comp.id}
                type="button"
                onClick={() => setCompanyFilter(comp.name)}
                style={{
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: isSelected ? `1px solid ${comp.color}` : '1px solid #cbd5e1',
                  background: isSelected ? comp.color : '#f8fafc',
                  color: isSelected ? '#ffffff' : '#334155',
                  whiteSpace: 'nowrap',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{comp.name}</span>
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '9.5px',
                    background: isSelected ? 'rgba(255,255,255,0.25)' : '#e2e8f0',
                    color: isSelected ? '#ffffff' : '#475569',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main Chat Panel */}
      <div className="nesher-panel nesher-chat-layout" style={{ minHeight: '620px', height: 'calc(100vh - 280px)', maxHeight: '820px' }}>
        {/* Conversations Sidebar */}
        <div
          className={`nesher-chat-sidebar ${mobileTab === 'chat' ? 'nesher-mobile-hidden' : ''}`}
          style={{
            width: '320px',
            borderRight: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Search Box */}
          <div style={{ padding: '12px 14px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={userIsAdmin ? "Buscar por empresa, contato ou protocolo..." : "Buscar na conversa..."}
                className="nesher-form-input"
                style={{ width: '100%', paddingLeft: '32px', height: '34px', fontSize: '11px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i
                className="ti ti-search"
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {visibleConversations.length === 0 ? (
              <div style={{ padding: '30px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                <i className="ti ti-message-off" style={{ fontSize: '28px', display: 'block', marginBottom: '8px' }} />
                Nenhuma conversa encontrada {companyFilter !== 'all' ? `para ${companyFilter}` : ''}.
              </div>
            ) : (
              visibleConversations.map((c) => {
                const isSelected = activeConv?.id === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedConversationId(c.id);
                      setMobileTab('chat');
                    }}
                    style={{
                      padding: '12px 14px',
                      borderBottom: '1px solid #edf2f7',
                      cursor: 'pointer',
                      background: isSelected ? '#eff6ff' : '#ffffff',
                      borderLeft: isSelected ? '3px solid #0b68d1' : '3px solid transparent',
                      transition: 'background 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      {/* Company Avatar Badge */}
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          background: c.companyColor || '#0b68d1',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 800,
                          flexShrink: 0,
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        }}
                      >
                        {c.companyInitials || c.company.slice(0, 2).toUpperCase()}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <strong
                            style={{
                              fontSize: '12px',
                              color: '#0f172a',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {c.clientName}
                          </strong>
                          <span style={{ fontSize: '10px', color: '#94a3b8', marginLeft: '6px' }}>{c.time}</span>
                        </div>

                        <div style={{ fontSize: '11px', color: '#0b68d1', fontWeight: 700, marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          🏢 {c.company} {c.ticketProtocol ? `• ${c.ticketProtocol}` : ''}
                        </div>

                        <div
                          style={{
                            fontSize: '11px',
                            color: '#64748b',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {c.lastMessage}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Conversation Area */}
        {activeConv ? (
          <div
            className={`nesher-chat-area ${mobileTab === 'list' ? 'nesher-mobile-hidden' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', height: '100%', flex: 1 }}
          >
            {/* Topbar of Active Conversation */}
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                background: '#fafcff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  className="nesher-btn-secondary nesher-mobile-only"
                  onClick={() => setMobileTab('list')}
                  style={{ padding: '0 8px', height: '30px', fontSize: '11px' }}
                  title="Voltar para a lista de conversas"
                >
                  <i className="ti ti-arrow-left" />
                  <span>Lista</span>
                </button>

                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: activeConv.companyColor || '#0b68d1',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 800,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                  }}
                >
                  {activeConv.companyInitials || activeConv.company.slice(0, 2).toUpperCase()}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>{activeConv.clientName}</strong>
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background: '#eff6ff',
                        color: '#1d4ed8',
                        fontWeight: 700,
                      }}
                    >
                      🏢 {activeConv.company}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {activeConv.ticketProtocol ? (
                      <>Chamado <strong>{activeConv.ticketProtocol}</strong> • {activeConv.subject}</>
                    ) : (
                      activeConv.subject
                    )}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                {activeConv.ticketId && (
                  <Link
                    href="/dashboard/chamados"
                    className="nesher-select"
                    style={{ padding: '5px 12px', fontSize: '11px', fontWeight: 700 }}
                  >
                    <i className="ti ti-arrow-up-right" /> Ver Chamado
                  </Link>
                )}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '11px',
                    color: '#059669',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
                  Canal Online
                </span>
              </div>
            </div>

            {/* Messages Feed */}
            <div
              style={{
                flex: 1,
                padding: '20px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                background: '#f8fafc',
              }}
            >
              {/* Security Header Inside Chat */}
              <div
                style={{
                  alignSelf: 'center',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '5px 14px',
                  fontSize: '10.5px',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <i className="ti ti-lock" style={{ color: '#0b68d1' }} />
                <span>Canal direto entre <strong>{activeConv.company}</strong> e <strong>Nesher Tech (Admin Global)</strong></span>
              </div>

              {activeConv.messages.map((m) => {
                const isAgent = m.sender === 'agent';
                return (
                  <div
                    key={m.id}
                    style={{
                      alignSelf: isAgent ? 'flex-end' : 'flex-start',
                      maxWidth: '72%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isAgent ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        background: isAgent ? '#0b68d1' : '#ffffff',
                        color: isAgent ? '#ffffff' : '#0f172a',
                        padding: '10px 14px',
                        borderRadius: isAgent ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        fontSize: '12.5px',
                        lineHeight: 1.5,
                        boxShadow: '0 2px 4px rgba(15, 23, 42, 0.05)',
                        border: isAgent ? 'none' : '1px solid #e2e8f0',
                        wordBreak: 'break-word',
                      }}
                    >
                      {m.text}
                    </div>
                    <div
                      style={{
                        fontSize: '9.5px',
                        color: '#94a3b8',
                        marginTop: '4px',
                        display: 'flex',
                        gap: '6px',
                      }}
                    >
                      <span>{m.author}</span>
                      <span>•</span>
                      <span>{m.time}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Answer Chips */}
            <div
              style={{
                padding: '6px 16px',
                background: '#ffffff',
                borderTop: '1px solid #f1f5f9',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
              }}
            >
              {[
                'Técnico a caminho para verificação.',
                'Tráfego e link sob análise no NOC.',
                'Chamado concluído com sucesso!',
                'Pode confirmar se o acesso normalizou?',
              ].map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setNewMessage(chip)}
                  style={{
                    padding: '3px 10px',
                    borderRadius: '12px',
                    fontSize: '10.5px',
                    background: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    color: '#475569',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ⚡ {chip}
                </button>
              ))}
            </div>

            {/* Message Input Bar */}
            <form
              onSubmit={handleSendMessage}
              style={{
                padding: '12px 18px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                gap: '10px',
                background: '#ffffff',
              }}
            >
              <input
                type="text"
                className="nesher-form-input"
                placeholder={
                  userIsAdmin
                    ? `Enviar resposta para ${activeConv.clientName} (${activeConv.company})...`
                    : 'Escreva sua mensagem para o Administrador Global / Suporte...'
                }
                style={{ flex: 1, fontSize: '12px' }}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button
                type="submit"
                className="nesher-primary-button"
                disabled={!newMessage.trim()}
                style={{
                  fontWeight: 700,
                  opacity: newMessage.trim() ? 1 : 0.6,
                  cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                <i className="ti ti-send" />
                <span>Enviar</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="nesher-empty-state" style={{ display: 'grid', placeItems: 'center', height: '100%', flex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <i className="ti ti-messages" style={{ fontSize: '42px', color: '#94a3b8', marginBottom: '12px' }} />
              <strong style={{ display: 'block', fontSize: '15px', color: '#0f172a' }}>Nenhuma conversa selecionada</strong>
              <p style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>
                Selecione uma empresa ou contato à esquerda para visualizar o histórico de mensagens.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Nova Conversa com Empresa */}
      {isNewConvModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setIsNewConvModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '520px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ti ti-message-plus" style={{ fontSize: '20px', color: '#0b68d1' }} />
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                  {userIsAdmin ? 'Iniciar Conversa com Empresa' : 'Nova Mensagem para o Suporte'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewConvModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewConversation} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {userIsAdmin ? (
                <div className="nesher-form-group">
                  <label>
                    Selecionar Empresa Cliente <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select
                    className="nesher-form-input"
                    value={newConvCompany}
                    onChange={(e) => {
                      const sel = e.target.value;
                      setNewConvCompany(sel);
                      const found = companiesList.find((c) => c.name === sel);
                      if (found) setNewConvContact(found.contact);
                    }}
                    required
                  >
                    {companiesList.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="nesher-form-group">
                  <label>Empresa Solicitante</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    value={clientCompany}
                    disabled
                    style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                  />
                </div>
              )}

              <div className="nesher-form-group">
                <label>
                  {userIsAdmin ? 'Nome do Contato na Empresa' : 'Seu Nome / Solicitante'} <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="nesher-form-input"
                  placeholder="Ex: Roberto Silva"
                  value={newConvContact}
                  onChange={(e) => setNewConvContact(e.target.value)}
                  required
                />
              </div>

              <div className="nesher-form-group">
                <label>
                  Assunto ou Chamado de Referência <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <input
                  type="text"
                  className="nesher-form-input"
                  placeholder="Ex: Suporte a Servidor / Dúvida Operacional"
                  value={newConvSubject}
                  onChange={(e) => setNewConvSubject(e.target.value)}
                  required
                />
              </div>

              <div className="nesher-form-group">
                <label>
                  Mensagem Inicial <span style={{ color: '#dc2626' }}>*</span>
                </label>
                <textarea
                  className="nesher-form-input"
                  rows={3}
                  placeholder="Digite a mensagem inicial para iniciar o canal de suporte..."
                  value={newConvInitialMsg}
                  onChange={(e) => setNewConvInitialMsg(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="nesher-btn-secondary"
                  onClick={() => setIsNewConvModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="nesher-primary-button">
                  <i className="ti ti-check" /> Iniciar Conversa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
