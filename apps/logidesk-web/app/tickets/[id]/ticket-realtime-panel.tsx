'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { getSessionAccessToken } from '@/src/lib/session';

type TicketEvent = {
  eventName: string;
  ticketId?: string;
  ticketNumber?: string;
  status?: string;
  priority?: string;
  messageId?: string;
  createdAt?: string;
  updatedAt?: string;
};

type JoinResponse = {
  ok: boolean;
  room?: string;
  error?: string;
};

const API_URL = process.env.NEXT_PUBLIC_LOGIDESK_API_URL ?? 'http://localhost:3533/api/v1';

export function TicketRealtimePanel({ ticketId }: { ticketId: string }) {
  const [status, setStatus] = useState('Aguardando token de sessao');
  const [events, setEvents] = useState<TicketEvent[]>([]);
  const socketUrl = useMemo(() => API_URL.replace(/\/api\/v1\/?$/, ''), []);

  useEffect(() => {
    let active = true;
    let socket: Socket | null = null;

    async function connect() {
      const token = await getSessionAccessToken();

      if (!active || !token) {
        return;
      }

      socket = io(socketUrl, {
        path: '/socket.io',
        auth: { token },
        withCredentials: true,
        transports: ['websocket', 'polling'],
      });

      const registerEvent = (eventName: string) => (payload: Omit<TicketEvent, 'eventName'>) => {
        setEvents((current) => [{ ...payload, eventName }, ...current].slice(0, 8));
      };

      socket.on('connect', () => {
        socket?.emit('ticket:join', { ticketId }, (response: JoinResponse) => {
          setStatus(response.ok ? `Conectado em ${response.room}` : `Sem acesso realtime: ${response.error ?? 'ACCESS_DENIED'}`);
        });
      });
      socket.on('connect_error', () => setStatus('Tempo real indisponivel'));
      socket.on('ticket:created', registerEvent('ticket:created'));
      socket.on('ticket:updated', registerEvent('ticket:updated'));
      socket.on('ticket:assigned', registerEvent('ticket:assigned'));
      socket.on('ticket:message:created', registerEvent('ticket:message:created'));
    }

    void connect();

    return () => {
      active = false;
      socket?.disconnect();
    };
  }, [socketUrl, ticketId]);

  return (
    <section style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <h3 style={{ margin: 0, fontSize: 18 }}>Tempo real do chamado</h3>
        <span style={badgeStyle}>{status}</span>
      </div>
      {events.length ? (
        <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
          {events.map((event, index) => (
            <article key={`${event.eventName}-${event.messageId ?? event.updatedAt ?? index}`} style={eventStyle}>
              <p style={{ margin: 0, fontWeight: 800 }}>{event.eventName}</p>
              <p style={{ margin: '4px 0 0', color: 'var(--desk-muted)', fontSize: 13 }}>
                {[event.status, event.priority, event.ticketNumber].filter(Boolean).join(' | ') || event.messageId || ticketId}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p style={{ margin: '10px 0 0', color: 'var(--desk-muted)', fontSize: 14 }}>Eventos novos deste chamado aparecerao aqui durante a sessao.</p>
      )}
    </section>
  );
}

const panelStyle: CSSProperties = { border: '1px solid var(--desk-border)', borderRadius: 8, background: 'var(--desk-surface)', padding: 20 };
const badgeStyle: CSSProperties = { borderRadius: 8, background: 'var(--desk-surface-muted)', padding: '6px 10px', fontSize: 12, fontWeight: 800 };
const eventStyle: CSSProperties = { border: '1px solid var(--desk-border)', borderRadius: 8, padding: 10 };
