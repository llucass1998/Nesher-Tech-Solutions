'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';

type NotificationPayload = {
  id: string;
  type: string;
  title: string;
  body: string;
  ticketId?: string | null;
  userId?: string | null;
  teamId?: string | null;
  correlationId?: string;
  createdAt?: string;
};

type ConnectionState = 'idle' | 'connecting' | 'connected' | 'error';

const API_URL = process.env.NEXT_PUBLIC_LOGIDESK_API_URL ?? 'http://localhost:3533/api/v1';
const SESSION_TOKEN_KEYS = ['logiidentity.accessToken', 'logidesk.accessToken'];

export function RealtimeNotifications() {
  const [connectionState, setConnectionState] = useState<ConnectionState>('idle');
  const [notifications, setNotifications] = useState<NotificationPayload[]>([]);

  const socketUrl = useMemo(() => API_URL.replace(/\/api\/v1\/?$/, ''), []);

  useEffect(() => {
    const token = readSessionToken();

    if (!token) {
      return undefined;
    }

    const socket: Socket = io(socketUrl, {
      path: '/socket.io',
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      setConnectionState('connected');
    });

    socket.on('connect_error', () => {
      setConnectionState('error');
    });

    socket.on('disconnect', () => {
      setConnectionState('idle');
    });

    socket.on('notification:created', (notification: NotificationPayload) => {
      setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 5));
    });

    return () => {
      socket.disconnect();
    };
  }, [socketUrl]);

  if (connectionState === 'idle' && notifications.length === 0) {
    return null;
  }

  return (
    <aside aria-live="polite" style={containerStyle}>
      <div style={statusStyle}>
        <span style={{ ...dotStyle, background: statusColor(connectionState) }} />
        <span>{statusLabel(connectionState)}</span>
      </div>
      {notifications.map((notification) => (
        <article key={notification.id} style={notificationStyle}>
          <p style={{ margin: 0, fontWeight: 800 }}>{notification.title}</p>
          <p style={{ margin: '4px 0 0', color: 'var(--desk-muted)', fontSize: 13 }}>{notification.body}</p>
        </article>
      ))}
    </aside>
  );
}

function readSessionToken() {
  for (const key of SESSION_TOKEN_KEYS) {
    const value = window.sessionStorage.getItem(key);

    if (value) {
      return value;
    }
  }

  return null;
}

function statusLabel(state: ConnectionState) {
  if (state === 'connected') {
    return 'Tempo real ativo';
  }

  if (state === 'connecting') {
    return 'Conectando tempo real';
  }

  if (state === 'error') {
    return 'Tempo real indisponivel';
  }

  return 'Tempo real inativo';
}

function statusColor(state: ConnectionState) {
  if (state === 'connected') {
    return 'var(--desk-success)';
  }

  if (state === 'connecting') {
    return 'var(--desk-warning)';
  }

  if (state === 'error') {
    return 'var(--desk-danger)';
  }

  return 'var(--desk-muted)';
}

const containerStyle: CSSProperties = {
  position: 'fixed',
  right: 16,
  bottom: 16,
  zIndex: 50,
  width: 'min(360px, calc(100vw - 32px))',
  display: 'grid',
  gap: 8,
};

const statusStyle: CSSProperties = {
  display: 'inline-flex',
  width: 'fit-content',
  alignItems: 'center',
  gap: 8,
  border: '1px solid var(--desk-border)',
  borderRadius: 8,
  background: 'var(--desk-surface)',
  padding: '8px 10px',
  color: 'var(--desk-muted)',
  fontSize: 12,
  fontWeight: 800,
  boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
};

const dotStyle: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
};

const notificationStyle: CSSProperties = {
  border: '1px solid var(--desk-border)',
  borderRadius: 8,
  background: 'var(--desk-surface)',
  padding: 12,
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.16)',
};
