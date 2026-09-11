'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

interface ConversationItem {
  id: string | number;
  ticketId?: string;
  clientName: string;
  company: string;
  ticketProtocol: string;
  subject: string;
  lastMessage: string;
  time: string;
  unread: number;
  messages: Array<{
    sender: 'client' | 'agent' | 'system';
    text: string;
    time: string;
  }>;
}

const defaultConversations: ConversationItem[] = [
  {
    id: 'conv-default-1',
    clientName: 'Roberto Silva',
    company: 'LogiFlow Transportes',
    ticketProtocol: 'NS-2026-0031',
    subject: 'Lentidão no switch principal do CPD',
    lastMessage: 'Técnico a caminho para substituição do patch cord.',
    time: '14:22',
    unread: 0,
    messages: [
      { sender: 'client', text: 'Boa tarde, notamos que a rede interna do setor fiscal caiu.', time: '14:15' },
      { sender: 'agent', text: 'Boa tarde Roberto, estamos analisando o tráfego do switch agora.', time: '14:18' },
      { sender: 'agent', text: 'Técnico a caminho para substituição do patch cord.', time: '14:22' },
    ],
  },
];

export default function ComunicacaoPage() {
  const [conversations, setConversations] = useState<ConversationItem[]>(defaultConversations);
  const [selectedConversationId, setSelectedConversationId] = useState<string | number>('conv-default-1');
  const [mobileTab, setMobileTab] = useState<'list' | 'chat'>('list');
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Hydrate conversations from real localStorage tickets
  useEffect(() => {
    try {
      const rawTickets = window.localStorage.getItem('nesher_tickets');
      if (rawTickets) {
        const parsed = JSON.parse(rawTickets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const fromTickets: ConversationItem[] = parsed.map((t: any) => {
            const ticketMsgs = Array.isArray(t.messages)
              ? t.messages
                  .filter((m: any) => m.type !== 'note')
                  .map((m: any) => ({
                    sender: m.type === 'client' ? ('client' as const) : m.type === 'system' ? ('system' as const) : ('agent' as const),
                    text: m.text,
                    time: m.time || 'Hoje',
                  }))
              : [];

            if (ticketMsgs.length === 0 && t.description) {
              ticketMsgs.push({
                sender: 'client',
                text: t.description,
                time: t.createdAt || 'Abertura',
              });
            }

            const lastMsg = ticketMsgs.length > 0 ? ticketMsgs[ticketMsgs.length - 1].text : t.description || 'Chamado aberto';
            const lastTime = ticketMsgs.length > 0 ? ticketMsgs[ticketMsgs.length - 1].time : 'Hoje';

            return {
              id: t.id,
              ticketId: t.id,
              clientName: t.requester || 'Solicitante',
              company: t.company || 'Empresa Cliente',
              ticketProtocol: t.code || 'NS-2026-TKT',
              subject: t.subject || 'Atendimento Técnico',
              lastMessage: lastMsg,
              time: lastTime,
              unread: 0,
              messages: ticketMsgs,
            };
          });

          setConversations(fromTickets);
          setSelectedConversationId(fromTickets[0].id);
          return;
        }
      }
    } catch {}
  }, []);

  const filteredConversations = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.ticketProtocol.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
    );
  }, [conversations, searchTerm]);

  const activeConv = useMemo(() => {
    return conversations.find((c) => c.id === selectedConversationId) || filteredConversations[0] || conversations[0] || null;
  }, [conversations, selectedConversationId, filteredConversations]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConv) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msgText = newMessage.trim();

    const updated = conversations.map((c) => {
      if (c.id !== activeConv.id) return c;
      return {
        ...c,
        lastMessage: msgText,
        time: timeStr,
        messages: [
          ...c.messages,
          {
            sender: 'agent' as const,
            text: msgText,
            time: timeStr,
          },
        ],
      };
    });

    setConversations(updated);
    setNewMessage('');

    // Also persist into nesher_tickets if linked to a ticket
    if (activeConv.ticketId) {
      try {
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
                  author: 'Administrador Global',
                  text: msgText,
                  time: timeStr,
                  type: 'support',
                },
              ],
            };
          });
          window.localStorage.setItem('nesher_tickets', JSON.stringify(updatedTickets));
        }
      } catch {}
    }
  };

  return (
    <div className="nesher-dashboard">
      <div className="nesher-welcome-row">
        <div>
          <p className="nesher-eyebrow">CANAL DIRETO DE SUPORTE &amp; ATENDIMENTO</p>
          <h1>Central de Conversas &amp; Chat</h1>
          <p className="nesher-welcome-copy">
            Troca de mensagens em tempo real com solicitantes, envio de prints de diagnóstico e notas internas.
          </p>
        </div>

        <Link href="/dashboard/respostas-rapidas" className="nesher-select" style={{ fontWeight: 700 }}>
          <i className="ti ti-bolt" /> Modelos de Respostas Rápidas
        </Link>
      </div>

      <div className="nesher-panel nesher-chat-layout">
        {/* Conversations Sidebar */}
        <div
          className={`nesher-chat-sidebar ${mobileTab === 'chat' ? 'nesher-mobile-hidden' : ''}`}
          style={{ borderRight: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}
        >
          <div style={{ padding: '14px', borderBottom: '1px solid #e2e8f0' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Buscar conversa ou protocolo..."
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

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filteredConversations.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  setSelectedConversationId(c.id);
                  setMobileTab('chat');
                }}
                style={{
                  padding: '14px',
                  borderBottom: '1px solid #edf2f7',
                  cursor: 'pointer',
                  background: activeConv?.id === c.id ? '#eff6ff' : '#ffffff',
                  borderLeft: activeConv?.id === c.id ? '3px solid #0b68d1' : '3px solid transparent',
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '12px', color: '#0f172a' }}>{c.clientName}</strong>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>{c.time}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#0b68d1', fontWeight: 700, marginBottom: '4px' }}>
                  {c.ticketProtocol} • {c.company}
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
            ))}
          </div>
        </div>

        {/* Chat Conversation Area */}
        {activeConv ? (
          <div
            className={`nesher-chat-area ${mobileTab === 'list' ? 'nesher-mobile-hidden' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', background: '#ffffff', height: '100%' }}
          >
            <div
              style={{
                padding: '12px 18px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  className="nesher-btn-secondary nesher-mobile-only"
                  onClick={() => setMobileTab('list')}
                  style={{ padding: '0 8px', height: '30px', fontSize: '11px' }}
                  title="Voltar para a lista de conversas"
                >
                  <i className="ti ti-arrow-left" />
                  <span>Conversas</span>
                </button>
                <div>
                  <strong style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>{activeConv.clientName}</strong>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    Chamado <strong>{activeConv.ticketProtocol}</strong> • {activeConv.subject}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <Link
                  href="/dashboard/chamados"
                  className="nesher-select"
                  style={{ padding: '4px 10px', fontSize: '11px', fontWeight: 700 }}
                >
                  <i className="ti ti-arrow-up-right" /> Ver Chamado
                </Link>
              </div>
            </div>

            {/* Messages Feed */}
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeConv.messages.map((m, mIdx) => (
                <div
                  key={mIdx}
                  style={{
                    alignSelf: m.sender === 'agent' ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                  }}
                >
                  <div
                    style={{
                      background: m.sender === 'agent' ? '#0b68d1' : '#f1f5f9',
                      color: m.sender === 'agent' ? '#ffffff' : '#0f172a',
                      padding: '10px 14px',
                      borderRadius: m.sender === 'agent' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                      fontSize: '12px',
                      lineHeight: 1.45,
                    }}
                  >
                    {m.text}
                  </div>
                  <div
                    style={{
                      fontSize: '9px',
                      color: '#94a3b8',
                      marginTop: '3px',
                      textAlign: m.sender === 'agent' ? 'right' : 'left',
                    }}
                  >
                    {m.sender === 'agent' ? 'Nesher Tech' : activeConv.clientName} • {m.time}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendMessage} style={{ padding: '14px 20px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="nesher-form-input"
                placeholder="Digite uma mensagem ou use '/' para resposta rápida..."
                style={{ flex: 1 }}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" className="nesher-primary-button">
                <i className="ti ti-send" /> Enviar
              </button>
            </form>
          </div>
        ) : (
          <div className="nesher-empty-state" style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
            <span>Selecione uma conversa para visualizar o histórico.</span>
          </div>
        )}
      </div>
    </div>
  );
}
