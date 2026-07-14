import { Injectable, Logger } from '@nestjs/common';
import type { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import type { Socket } from 'socket.io';
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

@Injectable()
export class RealtimeService {
  private readonly logger = new Logger(RealtimeService.name);
  private server: Server | null = null;

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
}
