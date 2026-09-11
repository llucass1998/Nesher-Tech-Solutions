'use client';

import { useState } from 'react';

interface QuickReply {
  id: string;
  shortcut: string;
  title: string;
  category: string;
  content: string;
}

const defaultReplies: QuickReply[] = [
  {
    id: 'qr-1',
    shortcut: '/ola',
    title: 'Boas-vindas & Abertura de Chamado',
    category: 'Geral',
    content: 'Olá! Recebemos sua solicitação e nossa equipe técnica já iniciou a análise preliminar. Em instantes um analista dará continuidade.',
  },
  {
    id: 'qr-2',
    shortcut: '/print',
    title: 'Solicitação de Print / Evidência de Erro',
    category: 'Triagem',
    content: 'Para que possamos identificar com precisão a falha, por favor nos envie uma captura de tela (print) da mensagem de erro completa exibida no monitor.',
  },
  {
    id: 'qr-3',
    shortcut: '/remoto',
    title: 'Instrução para Acesso Remoto',
    category: 'Suporte Remoto',
    content: 'Por favor, abra o assistente remoto Nesher Tech instalado na sua área de trabalho e nos informe a ID e a senha numérica temporária de conexão.',
  },
  {
    id: 'qr-4',
    shortcut: '/visita',
    title: 'Aviso de Agendamento de Visita Presencial',
    category: 'Campo',
    content: 'Identificamos a necessidade de intervenção física. Um técnico especializado foi escalado para comparecer ao local no horário acordado.',
  },
  {
    id: 'qr-5',
    shortcut: '/concluido',
    title: 'Conclusão e Testes de Validação',
    category: 'Fechamento',
    content: 'O procedimento técnico foi finalizado com êxito. Pedimos a gentileza de testar a funcionalidade e nos confirmar se está tudo operando 100%.',
  },
];

export default function RespostasRapidasPage() {
  const [replies, setReplies] = useState<QuickReply[]>(defaultReplies);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newReply, setNewReply] = useState({
    shortcut: '',
    title: '',
    category: 'Geral',
    content: '',
  });

  const handleSaveReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.shortcut || !newReply.title || !newReply.content) return;

    const formattedShortcut = newReply.shortcut.startsWith('/') ? newReply.shortcut : '/' + newReply.shortcut;

    const item: QuickReply = {
      id: 'qr-' + Date.now(),
      shortcut: formattedShortcut,
      title: newReply.title,
      category: newReply.category,
      content: newReply.content,
    };

    setReplies([item, ...replies]);
    setIsModalOpen(false);
    setNewReply({ shortcut: '', title: '', category: 'Geral', content: '' });
  };

  return (
    <div className="nesher-dashboard">
      <div className="nesher-welcome-row">
        <div>
          <p className="nesher-eyebrow">AGILIDADE &amp; PADRONIZAÇÃO NO ATENDIMENTO</p>
          <h1>Respostas Rápidas &amp; Macros</h1>
          <p className="nesher-welcome-copy">
            Modelos de mensagens pré-formatadas para técnicos inserirem rapidamente nas conversas com atalhos como <code>/remoto</code> ou <code>/ola</code>.
          </p>
        </div>

        <button type="button" className="nesher-primary-button" onClick={() => setIsModalOpen(true)}>
          <i className="ti ti-plus" /> Nova Resposta Rápida
        </button>
      </div>

      <div className="nesher-panel" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
          {replies.map((r) => (
            <div
              key={r.id}
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                background: '#ffffff',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    background: '#eff6ff',
                    color: '#0b68d1',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontSize: '11px',
                  }}
                >
                  {r.shortcut}
                </span>
                <span className="nesher-sla-badge" style={{ background: '#f1f5f9', color: '#475569', fontSize: '10px' }}>
                  {r.category}
                </span>
              </div>

              <strong style={{ fontSize: '13px', color: '#0f172a' }}>{r.title}</strong>

              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: '12px',
                  color: '#64748b',
                  lineHeight: 1.45,
                  background: '#f8fafc',
                  padding: '10px',
                  borderRadius: '6px',
                }}
              >
                {r.content}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nova Resposta Rápida */}
      {isModalOpen && (
        <div className="nesher-preview-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="nesher-preview-modal-dialog" style={{ maxWidth: '500px', height: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="nesher-preview-modal-header">
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>Criar Modelo de Resposta Rápida</h4>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#cbd5e1', fontSize: '18px', cursor: 'pointer' }}
              >
                <i className="ti ti-x" />
              </button>
            </div>

            <form onSubmit={handleSaveReply} style={{ padding: '20px' }}>
              <div className="nesher-form-row">
                <div className="nesher-form-group">
                  <label>Atalho de Teclado</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    placeholder="/atalho"
                    value={newReply.shortcut}
                    onChange={(e) => setNewReply({ ...newReply, shortcut: e.target.value })}
                    required
                  />
                </div>
                <div className="nesher-form-group">
                  <label>Categoria</label>
                  <input
                    type="text"
                    className="nesher-form-input"
                    placeholder="Ex: Geral, Triagem"
                    value={newReply.category}
                    onChange={(e) => setNewReply({ ...newReply, category: e.target.value })}
                  />
                </div>
              </div>

              <div className="nesher-form-group" style={{ marginBottom: '14px' }}>
                <label>Título Identificador</label>
                <input
                  type="text"
                  className="nesher-form-input"
                  placeholder="Ex: Instruções de VPN"
                  value={newReply.title}
                  onChange={(e) => setNewReply({ ...newReply, title: e.target.value })}
                  required
                />
              </div>

              <div className="nesher-form-group" style={{ marginBottom: '18px' }}>
                <label>Texto da Mensagem</label>
                <textarea
                  className="nesher-form-input"
                  style={{ height: '90px', padding: '10px', resize: 'vertical' }}
                  placeholder="Digite o texto pronto que será enviado ao cliente..."
                  value={newReply.content}
                  onChange={(e) => setNewReply({ ...newReply, content: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="nesher-select" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="nesher-primary-button">
                  Salvar Resposta Rápida
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
