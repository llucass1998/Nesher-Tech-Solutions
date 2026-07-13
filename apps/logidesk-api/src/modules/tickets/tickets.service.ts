import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { Prisma, TicketPriority, TicketStatus } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateTicketFromLogiflowDto } from './dto/create-ticket-from-logiflow.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  listTickets(filters: { status?: string; priority?: string; search?: string }) {
    const where: Prisma.TicketWhereInput = {
      ...(filters.status ? { status: filters.status as TicketStatus } : {}),
      ...(filters.priority ? { priority: filters.priority as TicketPriority } : {}),
      ...(filters.search
        ? {
            OR: [
              { number: { contains: filters.search, mode: 'insensitive' } },
              { subject: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.ticket.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      take: 100,
      include: { sla: true, _count: { select: { messages: true, notes: true } } },
    });
  }

  async getTicket(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        notes: { orderBy: { createdAt: 'asc' } },
        history: { orderBy: { createdAt: 'asc' } },
        sla: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException({ error: 'Ticket not found.' });
    }

    return ticket;
  }

  async createFromLogiflow(input: CreateTicketFromLogiflowDto, idempotencyKey?: string) {
    const key = idempotencyKey ?? `${input.occurrenceId}:${input.correlationId}`;
    const requestHash = this.hash(input);
    const existingIdempotency = await this.prisma.idempotencyRecord.findUnique({ where: { key } });

    if (existingIdempotency) {
      if (existingIdempotency.requestHash !== requestHash) {
        throw new ConflictException({ error: 'Idempotency key reused with a different payload.' });
      }

      if (existingIdempotency.responseRef) {
        return this.getTicket(existingIdempotency.responseRef);
      }
    }

    const existingTicket = await this.prisma.ticket.findUnique({
      where: { externalSystem_externalId: { externalSystem: 'LOGIFLOW', externalId: input.occurrenceId } },
    });

    if (existingTicket) {
      return existingTicket;
    }

    const now = new Date();
    const number = await this.nextTicketNumber();

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          number,
          subject: input.subject,
          description: input.description,
          priority: input.priority,
          source: 'LOGIFLOW',
          ...(input.requesterEmail ? { requesterEmail: input.requesterEmail } : {}),
          externalSystem: 'LOGIFLOW',
          externalId: input.occurrenceId,
          deliveryId: input.deliveryId,
          occurrenceId: input.occurrenceId,
          correlationId: input.correlationId,
          idempotencyKey: key,
          sla: {
            create: {
              firstResponseDueAt: this.addMinutes(now, this.firstResponseMinutes(input.priority)),
              resolutionDueAt: this.addMinutes(now, this.resolutionMinutes(input.priority)),
            },
          },
          history: {
            create: {
              action: 'ticket.created_from_logiflow',
              after: input as unknown as Prisma.InputJsonValue,
              actorRole: 'SERVICE',
              correlationId: input.correlationId,
            },
          },
        },
        include: { sla: true },
      });

      await tx.idempotencyRecord.upsert({
        where: { key },
        update: { responseRef: ticket.id },
        create: {
          key,
          operation: 'ticket.create_from_logiflow',
          requestHash,
          responseRef: ticket.id,
          correlationId: input.correlationId,
        },
      });

      await tx.outboxEvent.create({
        data: {
          eventType: 'ticket.created',
          eventVersion: 1,
          payload: {
            ticketId: ticket.id,
            ticketNumber: ticket.number,
            occurrenceId: input.occurrenceId,
            deliveryId: input.deliveryId,
          },
          correlationId: input.correlationId,
          causationId: input.occurrenceId,
        },
      });

      await tx.auditLog.create({
        data: {
          action: 'ticket.created_from_logiflow',
          entityType: 'Ticket',
          entityId: ticket.id,
          actorRole: 'SERVICE',
          after: { ticketId: ticket.id, number: ticket.number },
          correlationId: input.correlationId,
        },
      });

      return ticket;
    });
  }

  async updateTicket(id: string, input: UpdateTicketDto) {
    const current = await this.prisma.ticket.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException({ error: 'Ticket not found.' });
    }

    const correlationId = current.correlationId || randomUUID();
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: {
        ...(input.status ? { status: input.status } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
        ...(input.teamId ? { teamId: input.teamId } : {}),
        history: {
          create: {
            action: 'ticket.updated',
            before: current as unknown as Prisma.InputJsonValue,
            after: input as unknown as Prisma.InputJsonValue,
            actorRole: 'SUPPORT',
            correlationId,
          },
        },
      },
    });

    await this.prisma.outboxEvent.create({
      data: {
        eventType: 'ticket.updated',
        eventVersion: 1,
        payload: { ticketId: ticket.id, ticketNumber: ticket.number, status: ticket.status },
        correlationId,
        causationId: ticket.id,
      },
    });

    return ticket;
  }

  async createMessage(ticketId: string, input: CreateMessageDto) {
    await this.ensureTicket(ticketId);

    return this.prisma.ticketMessage.create({
      data: {
        ticketId,
        ...(input.authorId ? { authorId: input.authorId } : {}),
        authorRole: input.authorRole,
        body: input.body,
        internal: input.internal ?? false,
        correlationId: input.correlationId,
      },
    });
  }

  async createNote(ticketId: string, input: CreateMessageDto) {
    await this.ensureTicket(ticketId);

    return this.prisma.ticketNote.create({
      data: {
        ticketId,
        ...(input.authorId ? { authorId: input.authorId } : {}),
        body: input.body,
        correlationId: input.correlationId,
      },
    });
  }

  private async ensureTicket(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });

    if (!ticket) {
      throw new NotFoundException({ error: 'Ticket not found.' });
    }

    return ticket;
  }

  private async nextTicketNumber() {
    const count = await this.prisma.ticket.count();
    return `LD-${String(count + 1).padStart(6, '0')}`;
  }

  private hash(value: unknown) {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
  }

  private addMinutes(date: Date, minutes: number) {
    return new Date(date.getTime() + minutes * 60_000);
  }

  private firstResponseMinutes(priority: TicketPriority) {
    return priority === 'URGENT' ? 15 : priority === 'HIGH' ? 30 : priority === 'MEDIUM' ? 120 : 240;
  }

  private resolutionMinutes(priority: TicketPriority) {
    return priority === 'URGENT' ? 240 : priority === 'HIGH' ? 480 : priority === 'MEDIUM' ? 1440 : 2880;
  }
}
