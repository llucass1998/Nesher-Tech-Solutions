"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { TicketSummary, mutateLogiDesk } from '../lib/api';
import { TicketStatusBadge, PriorityBadge } from '@logipeople/ui';

export function KanbanBoard({ initialTickets }: { initialTickets: TicketSummary[] }) {
  const columns = ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'RESOLVED', 'CLOSED'];
  const [tickets, setTickets] = useState<TicketSummary[]>(initialTickets);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLElement>, ticketId: string) => {
    e.dataTransfer.setData('ticketId', ticketId);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLElement>) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDrop = async (e: React.DragEvent<HTMLElement>, targetStatus: string) => {
    e.preventDefault();
    const ticketId = e.dataTransfer.getData('ticketId');
    if (!ticketId) return;

    const ticketToMove = tickets.find((t) => t.id === ticketId);
    if (!ticketToMove || ticketToMove.status === targetStatus) return;

    const previousStatus = ticketToMove.status;
    setErrorMsg(null);

    // Optimistic update
    setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: targetStatus } : t)));

    // API Call
    const res = await mutateLogiDesk(`/tickets/${ticketId}/status`, 'PATCH', { status: targetStatus, reason: 'Moved via Kanban drag and drop' });
    
    if (res.error) {
      setErrorMsg(res.error);
      // Rollback on failure
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status: previousStatus } : t)));
    }
  };

  const allowDrop = (e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      {errorMsg ? (
        <section style={{ border: '1px solid var(--desk-danger)', borderRadius: 8, background: '#fff0f0', padding: 12 }}>
          <h3 style={{ margin: 0, color: 'var(--desk-danger)', fontSize: 14 }}>Transição Inválida</h3>
          <p style={{ margin: '4px 0 0', color: 'var(--desk-danger)', fontSize: 13 }}>{errorMsg}</p>
        </section>
      ) : null}
      
      <section style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10 }}>
        {columns.map((column) => (
          <div
            key={column}
            style={columnStyle}
            onDragOver={allowDrop}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
               <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--desk-brand)' }}>{column}</h3>
               <span style={{ background: 'var(--desk-surface-muted)', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600 }}>
                 {tickets.filter((t) => t.status === column).length}
               </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 100 }}>
              {tickets
                .filter((ticket) => ticket.status === column)
                .map((ticket) => (
                  <article
                    key={ticket.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, ticket.id)}
                    onDragEnd={handleDragEnd}
                    style={cardStyle}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Link href={`/tickets/${ticket.id}`} style={{ margin: 0, fontWeight: 800, color: 'var(--desk-brand)', fontSize: 13, textDecoration: 'none' }}>
                        {ticket.number}
                      </Link>
                    </div>
                    <p style={{ margin: '6px 0 0', color: 'var(--desk-muted)', fontSize: 13, lineHeight: 1.4 }}>{ticket.subject}</p>
                    
                    <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                      <TicketStatusBadge status={ticket.status} />
                      <PriorityBadge priority={ticket.priority} />
                    </div>
                  </article>
                ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

const columnStyle = {
  border: '1px solid var(--desk-border)',
  borderRadius: 8,
  background: 'var(--desk-surface)',
  padding: 14,
  minWidth: 280,
  flexShrink: 0
};

const cardStyle = {
  border: '1px solid var(--desk-border)',
  borderRadius: 6,
  padding: 12,
  background: '#ffffff',
  cursor: 'grab',
  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
};
