import { Injectable, Logger, Optional } from '@nestjs/common';
import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
import { PrismaService } from '../../prisma/prisma.service';
import { IdentityJwksService, LogiIdentityClaims } from '../auth/identity-jwks.service';

type NotificationPayload = {
  id: string;
  type: string;
  title: string;
  body: string;
  ticketId?: string | null;
  userId?: string | null;
  teamId?: string | null;
  correlationId: string;
  createdAt?: Date | string;
};

type JoinTicketPayload = {
  ticketId?: unknown;
};

type JoinTicketResponse = {
  ok: boolean;
  room?: string;
  error?: 'VALIDATION_ERROR' | 'ACCESS_DENIED';
};

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

  constructor(@Optional() private readonly prisma?: PrismaService) {}

  attach(httpServer: HttpServer, identityJwks: IdentityJwksService, corsOrigin: string) {
    if (this.server) {
      return;
    }

    this.server = new Server(httpServer, {
      cors: {
        origin: corsOrigin,
        credentials: true,
      },
      path: '/socket.io',
    });

    this.server.use(async (socket, next) => {
      try {
        const claims = await identityJwks.verifyAuthorizationHeader(this.getAuthorization(socket));
        this.joinIdentityRooms(socket, claims);
        next();
      } catch (error) {
        this.logger.warn({
          operation: 'socket.auth',
          socketId: socket.id,
          error: error instanceof Error ? error.message : 'Socket authentication failed',
        });
        next(new Error('AUTHENTICATION_REQUIRED'));
      }
    });

    this.server.on('connection', (socket) => {
      this.logger.log({
        operation: 'socket.connected',
        socketId: socket.id,
        userId: socket.data.userId,
        roles: socket.data.roles,
      });

      socket.on('ticket:join', (payload: JoinTicketPayload, ack?: (response: JoinTicketResponse) => void) => this.handleJoinTicket(socket, payload, ack));
    });
  }

  emitNotification(notification: NotificationPayload) {
    if (!this.server) {
      return;
    }

    const payload = {
      ...notification,
      createdAt: notification.createdAt instanceof Date ? notification.createdAt.toISOString() : notification.createdAt,
    };

    if (notification.userId) {
      this.server.to(`user:${notification.userId}`).emit('notification:created', payload);
    }

    if (notification.teamId) {
      this.server.to(`team:${notification.teamId}`).emit('notification:created', payload);
    }

    this.server.to('support').emit('notification:created', payload);
  }

  emitTicketEvent(eventName: string, ticketId: string, payload: Record<string, unknown>) {
    if (!this.server) {
      return;
    }

    this.server.to(`ticket:${ticketId}`).emit(eventName, payload);
    this.server.to('support').emit(eventName, payload);
  }

  private getAuthorization(socket: Socket) {
    const auth = socket.handshake.auth as Record<string, unknown> | undefined;
    const authToken = typeof auth?.token === 'string' ? auth.token : undefined;

    if (authToken) {
      return authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
    }

    const header = socket.handshake.headers.authorization;
    return Array.isArray(header) ? header[0] : header;
  }

  private joinIdentityRooms(socket: Socket, claims: LogiIdentityClaims) {
    const roles = claims.roles ?? [];

    socket.data.userId = claims.sub;
    socket.data.roles = roles;
    socket.join(`user:${claims.sub}`);

    for (const role of roles) {
      socket.join(`role:${role}`);
    }

    if (roles.includes('SUPPORT') || roles.includes('ADMIN')) {
      socket.join('support');
    }
  }

  private async handleJoinTicket(socket: Socket, payload: JoinTicketPayload, ack?: (response: JoinTicketResponse) => void) {
    const ticketId = typeof payload?.ticketId === 'string' ? payload.ticketId : undefined;

    if (!ticketId) {
      ack?.({ ok: false, error: 'VALIDATION_ERROR' });
      return;
    }

    const allowed = await this.canAccessTicket(socket, ticketId);

    if (!allowed) {
      this.logger.warn({
        operation: 'socket.ticket_join.denied',
        socketId: socket.id,
        userId: socket.data.userId,
        ticketId,
      });
      ack?.({ ok: false, error: 'ACCESS_DENIED' });
      return;
    }

    const room = `ticket:${ticketId}`;
    socket.join(room);
    ack?.({ ok: true, room });
  }

  private async canAccessTicket(socket: Socket, ticketId: string) {
    if (!this.prisma) {
      return false;
    }

    const roles = Array.isArray(socket.data.roles) ? socket.data.roles : [];
    const userId = typeof socket.data.userId === 'string' ? socket.data.userId : undefined;

    if (!userId) {
      return false;
    }

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      select: {
        requesterId: true,
        assigneeId: true,
        team: {
          select: {
            members: {
              where: { userId, isActive: true },
              select: { id: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!ticket) {
      return false;
    }

    if (roles.includes('ADMIN') || roles.includes('SUPPORT')) {
      return true;
    }

    return ticket.requesterId === userId || ticket.assigneeId === userId || Boolean(ticket.team?.members.length);
  }
}
