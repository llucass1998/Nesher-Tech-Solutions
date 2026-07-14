import { beforeEach, describe, expect, it, vi } from 'vitest';

const socketIoMock = vi.hoisted(() => {
  const server = {
    use: vi.fn(),
    on: vi.fn(),
    to: vi.fn(() => ({ emit: vi.fn() })),
  };

  return {
    server,
    Server: vi.fn(function Server() {
      return server;
    }),
  };
});

vi.mock('socket.io', () => ({ Server: socketIoMock.Server }));

import { RealtimeService } from '../src/modules/realtime/realtime.service';

function createSocket() {
  return {
    id: 'socket-1',
    data: {},
    handshake: {
      auth: { token: 'socket-token' },
      headers: {},
    },
    join: vi.fn(),
  };
}

describe('RealtimeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('authenticates socket connections and joins identity rooms', async () => {
    const realtime = new RealtimeService();
    const identityJwks = {
      verifyAuthorizationHeader: vi.fn().mockResolvedValue({
        sub: 'support-1',
        email: 'support@example.com',
        name: 'Support',
        roles: ['SUPPORT'],
      }),
    };
    const socket = createSocket();
    const next = vi.fn();

    realtime.attach({} as never, identityJwks as never, 'http://localhost:3500');
    const middleware = socketIoMock.server.use.mock.calls[0]?.[0];

    expect(middleware).toBeDefined();
    await middleware?.(socket, next);

    expect(identityJwks.verifyAuthorizationHeader).toHaveBeenCalledWith('Bearer socket-token');
    expect(socket.join).toHaveBeenCalledWith('user:support-1');
    expect(socket.join).toHaveBeenCalledWith('role:SUPPORT');
    expect(socket.join).toHaveBeenCalledWith('support');
    expect(next).toHaveBeenCalledWith();
  });

  it('emits notifications to user, team and support rooms', () => {
    const realtime = new RealtimeService();
    const emit = vi.fn();
    socketIoMock.server.to.mockReturnValue({ emit });

    realtime.attach({} as never, { verifyAuthorizationHeader: vi.fn() } as never, 'http://localhost:3500');
    realtime.emitNotification({
      id: 'notification-1',
      type: 'ticket.assigned',
      title: 'Chamado atribuido',
      body: 'Voce recebeu um chamado.',
      ticketId: 'ticket-1',
      userId: 'support-1',
      teamId: 'team-1',
      correlationId: 'corr-1',
      createdAt: new Date('2026-07-14T10:00:00.000Z'),
    });

    expect(socketIoMock.server.to).toHaveBeenCalledWith('user:support-1');
    expect(socketIoMock.server.to).toHaveBeenCalledWith('team:team-1');
    expect(socketIoMock.server.to).toHaveBeenCalledWith('support');
    expect(emit).toHaveBeenCalledWith('notification:created', expect.objectContaining({
      id: 'notification-1',
      createdAt: '2026-07-14T10:00:00.000Z',
    }));
  });
});
