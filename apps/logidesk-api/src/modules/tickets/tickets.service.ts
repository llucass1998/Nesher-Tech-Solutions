import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import { Prisma, TicketPriority, TicketStatus } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ChangeTicketPriorityDto } from './dto/change-ticket-priority.dto';
import { ChangeTicketStatusDto } from './dto/change-ticket-status.dto';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreateTicketFromLogiflowDto } from './dto/create-ticket-from-logiflow.dto';
import { CreateSupportCatalogDto, UpdateSupportCatalogDto } from './dto/support-catalog.dto';
import { UpdateInternalNoteDto } from './dto/update-internal-note.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

const allowedTransitions: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'CANCELED'],
  IN_PROGRESS: ['WAITING_CUSTOMER', 'WAITING_INTERNAL', 'RESOLVED'],
  WAITING_CUSTOMER: ['IN_PROGRESS'],
  WAITING_INTERNAL: ['IN_PROGRESS'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: ['IN_PROGRESS'],
  CANCELED: [],
  REOPENED: ['IN_PROGRESS'],
};

type TicketWithRelations = Prisma.TicketGetPayload<{
  include: {
    messages: true;
    notes: true;
    attachments: true;
    history: true;
    assignments: true;
    tagAssignments: { include: { tag: true } };
    team: true;
    categoryRecord: true;
    sla: true;
  };
}>;

type HistoryInput = {
  ticketId: string;
  action: string;
  correlationId: string;
  before?: Prisma.InputJsonValue | undefined;
  after?: Prisma.InputJsonValue | undefined;
  previousStatus?: TicketStatus | undefined;
  newStatus?: TicketStatus | undefined;
  actorId?: string | undefined;
  actorRole?: string | undefined;
  changedById?: string | undefined;
  reason?: string | undefined;
  requestId?: string | undefined;
};

type AuditInput = {
  actorId?: string | undefined;
  actorRole?: string | undefined;
  before?: Prisma.InputJsonValue | undefined;
  after?: Prisma.InputJsonValue | undefined;
  requestId?: string | undefined;
};

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  listTickets(filters: { status?: string; priority?: string; search?: string }) {
    const where: Prisma.TicketWhereInput = {
      archivedAt: null,
      ...(filters.status ? { status: filters.status as TicketStatus } : {}),
      ...(filters.priority ? { priority: filters.priority as TicketPriority } : {}),
      ...(filters.search
        ? {
            OR: [
              { number: { contains: filters.search, mode: 'insensitive' } },
              { subject: { contains: filters.search, mode: 'insensitive' } },
              { description: { contains: filters.search, mode: 'insensitive' } },
              { requesterEmail: { contains: filters.search, mode: 'insensitive' } },
              { requesterName: { contains: filters.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    return this.prisma.ticket.findMany({
      where,
      orderBy: [{ updatedAt: 'desc' }],
      take: 100,
      include: {
        team: true,
        categoryRecord: true,
        tagAssignments: { include: { tag: true } },
        sla: true,
        _count: { select: { messages: true, notes: true, assignments: true } },
      },
    });
  }

  async getTicket(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: { where: { internal: false }, orderBy: { createdAt: 'asc' } },
        notes: { orderBy: { createdAt: 'asc' } },
        attachments: { orderBy: { createdAt: 'asc' } },
        history: { orderBy: { createdAt: 'asc' } },
        assignments: { orderBy: { createdAt: 'asc' } },
        tagAssignments: { include: { tag: true }, orderBy: { createdAt: 'asc' } },
        team: true,
        categoryRecord: true,
        sla: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException({ error: 'Ticket not found.' });
    }

    return ticket;
  }

  async getPublicTicket(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: { where: { internal: false }, orderBy: { createdAt: 'asc' } },
        attachments: { orderBy: { createdAt: 'asc' } },
        history: { orderBy: { createdAt: 'asc' } },
        tagAssignments: { include: { tag: true }, orderBy: { createdAt: 'asc' } },
        team: true,
        categoryRecord: true,
        sla: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException({ error: 'Ticket not found.' });
    }

    return ticket;
  }

  async createTicket(input: CreateTicketDto) {
    const now = new Date();
    const number = await this.nextTicketNumber();
    const priority = input.priority ?? 'MEDIUM';
    const source = input.source ?? 'LOGIDESK';

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.create({
        data: {
          number,
          subject: input.subject,
          description: input.description,
          priority,
          source,
          correlationId: input.correlationId,
          ...this.optionalTicketCreateData(input),
        },
      });

      await tx.ticketSla.create({
        data: {
          ticketId: ticket.id,
          firstResponseDueAt: this.addMinutes(now, this.firstResponseMinutes(priority)),
          resolutionDueAt: this.addMinutes(now, this.resolutionMinutes(priority)),
        },
      });
      await this.createHistory(tx, {
        ticketId: ticket.id,
        action: 'ticket.created',
        after: input as unknown as Prisma.InputJsonValue,
        newStatus: 'OPEN',
        actorId: input.actorId,
        actorRole: 'SUPPORT',
        changedById: input.actorId,
        correlationId: input.correlationId,
      });

      if (input.tagIds?.length) {
        await tx.ticketTagAssignment.createMany({
          data: input.tagIds.map((tagId) => ({ ticketId: ticket.id, tagId })),
          skipDuplicates: true,
        });
      }

      if (input.assigneeId || input.teamId) {
        await this.createAssignment(tx, {
          ticketId: ticket.id,
          assigneeId: input.assigneeId,
          assignedById: input.actorId,
          teamId: input.teamId,
          reason: 'Initial assignment',
          correlationId: input.correlationId,
        });
      }

      await this.createOutbox(tx, 'ticket.created', ticket.id, input.correlationId, {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        status: ticket.status,
        source,
      });
      await this.createAudit(tx, 'ticket.created', 'Ticket', ticket.id, input.correlationId, {
        actorId: input.actorId,
        actorRole: 'SUPPORT',
        after: { ticketId: ticket.id, number: ticket.number },
      });

      return ticket;
    });
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
          externalSystem: 'LOGIFLOW',
          externalId: input.occurrenceId,
          deliveryId: input.deliveryId,
          occurrenceId: input.occurrenceId,
          correlationId: input.correlationId,
          idempotencyKey: key,
          ...(input.requesterEmail ? { requesterEmail: input.requesterEmail } : {}),
        },
      });

      await tx.ticketSla.create({
        data: {
          ticketId: ticket.id,
          firstResponseDueAt: this.addMinutes(now, this.firstResponseMinutes(input.priority)),
          resolutionDueAt: this.addMinutes(now, this.resolutionMinutes(input.priority)),
        },
      });
      await this.createHistory(tx, {
        ticketId: ticket.id,
        action: 'ticket.created_from_logiflow',
        after: input as unknown as Prisma.InputJsonValue,
        newStatus: 'OPEN',
        actorRole: 'SERVICE',
        correlationId: input.correlationId,
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
      await this.createOutbox(tx, 'ticket.created', ticket.id, input.correlationId, {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        occurrenceId: input.occurrenceId,
        deliveryId: input.deliveryId,
      }, input.occurrenceId);
      await this.createAudit(tx, 'ticket.created_from_logiflow', 'Ticket', ticket.id, input.correlationId, {
        actorRole: 'SERVICE',
        after: { ticketId: ticket.id, number: ticket.number },
      });

      return ticket;
    });
  }

  async updateTicket(id: string, input: UpdateTicketDto) {
    const current = await this.ensureTicket(id);
    const correlationId = input.correlationId ?? (current.correlationId || randomUUID());

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({
        where: { id },
        data: {
          ...this.optionalTicketUpdateData(input),
        },
      });

      await this.createHistory(tx, {
        ticketId: id,
        action: 'ticket.updated',
        before: this.ticketSnapshot(current),
        after: input as unknown as Prisma.InputJsonValue,
        actorId: input.actorId,
        actorRole: 'SUPPORT',
        changedById: input.actorId,
        correlationId,
      });

      if (input.tagIds) {
        await tx.ticketTagAssignment.deleteMany({ where: { ticketId: id } });
        if (input.tagIds.length) {
          await tx.ticketTagAssignment.createMany({
            data: input.tagIds.map((tagId) => ({ ticketId: id, tagId })),
            skipDuplicates: true,
          });
        }
      }

      await this.createOutbox(tx, 'ticket.updated', ticket.id, correlationId, {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        status: ticket.status,
        priority: ticket.priority,
      });
      await this.createAudit(tx, 'ticket.updated', 'Ticket', ticket.id, correlationId, {
        actorId: input.actorId,
        actorRole: 'SUPPORT',
        before: this.ticketSnapshot(current),
        after: input as unknown as Prisma.InputJsonValue,
      });

      return ticket;
    });
  }

  async changeStatus(id: string, input: ChangeTicketStatusDto) {
    const current = await this.ensureTicket(id);
    const target = input.status as TicketStatus;

    if (!allowedTransitions[current.status].includes(target)) {
      throw new UnprocessableEntityException({
        code: 'INVALID_TICKET_STATUS_TRANSITION',
        error: `Cannot transition ticket from ${current.status} to ${target}.`,
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({
        where: { id },
        data: {
          status: target,
          ...(target === 'CANCELED' ? { canceledAt: new Date() } : {}),
        },
      });
      await this.updateSlaForStatusChange(tx, current, target);

      await this.createHistory(tx, {
        ticketId: id,
        action: 'ticket.status_changed',
        before: { status: current.status },
        after: { status: target },
        previousStatus: current.status,
        newStatus: target,
        actorId: input.actorId,
        actorRole: 'SUPPORT',
        changedById: input.actorId,
        reason: input.reason,
        correlationId: input.correlationId,
      });
      await this.createOutbox(tx, 'ticket.status_changed', ticket.id, input.correlationId, {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        previousStatus: current.status,
        status: ticket.status,
      });
      await this.createAudit(tx, 'ticket.status_changed', 'Ticket', ticket.id, input.correlationId, {
        actorId: input.actorId,
        actorRole: 'SUPPORT',
        before: { status: current.status },
        after: { status: target },
      });

      return ticket;
    });
  }

  async changePriority(id: string, input: ChangeTicketPriorityDto) {
    const current = await this.ensureTicket(id);

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({ where: { id }, data: { priority: input.priority } });

      await this.createHistory(tx, {
        ticketId: id,
        action: 'ticket.priority_changed',
        before: { priority: current.priority },
        after: { priority: input.priority },
        actorId: input.actorId,
        actorRole: 'SUPPORT',
        changedById: input.actorId,
        reason: input.reason,
        correlationId: input.correlationId,
      });
      await this.createOutbox(tx, 'ticket.priority_changed', ticket.id, input.correlationId, {
        ticketId: ticket.id,
        ticketNumber: ticket.number,
        previousPriority: current.priority,
        priority: ticket.priority,
      });
      await this.createAudit(tx, 'ticket.priority_changed', 'Ticket', ticket.id, input.correlationId, {
        actorId: input.actorId,
        actorRole: 'SUPPORT',
        before: { priority: current.priority },
        after: { priority: input.priority },
      });

      return ticket;
    });
  }

  archiveTicket(id: string, input: ChangeTicketStatusDto) {
    return this.changeStatus(id, { ...input, status: 'CANCELED' });
  }

  async createMessage(ticketId: string, input: CreateMessageDto) {
    const current = await this.ensureTicket(ticketId);

    return this.prisma.$transaction(async (tx) => {
      const message = await tx.ticketMessage.create({
        data: {
          ticketId,
          authorRole: input.authorRole,
          body: input.body,
          internal: input.internal ?? false,
          correlationId: input.correlationId,
          ...(input.authorId ? { authorId: input.authorId } : {}),
        },
      });

      await this.createHistory(tx, {
        ticketId,
        action: input.internal ? 'ticket.internal_message_created' : 'ticket.message_created',
        after: { messageId: message.id, internal: message.internal },
        actorId: input.authorId,
        actorRole: input.authorRole,
        correlationId: input.correlationId,
      });
      await this.createOutbox(tx, input.internal ? 'ticket.internal_message_created' : 'ticket.message_created', ticketId, input.correlationId, {
        ticketId,
        messageId: message.id,
        internal: message.internal,
      }, message.id);
      await this.recordFirstResponse(tx, current, input);

      return message;
    });
  }

  async createNote(ticketId: string, input: CreateMessageDto) {
    await this.ensureTicket(ticketId);

    return this.prisma.$transaction(async (tx) => {
      const note = await tx.ticketNote.create({
        data: {
          ticketId,
          body: input.body,
          correlationId: input.correlationId,
          ...(input.authorId ? { authorId: input.authorId } : {}),
        },
      });

      await this.createHistory(tx, {
        ticketId,
        action: 'ticket.internal_note_created',
        after: { noteId: note.id },
        actorId: input.authorId,
        actorRole: input.authorRole,
        correlationId: input.correlationId,
      });
      await this.createOutbox(tx, 'ticket.internal_note_created', ticketId, input.correlationId, { ticketId, noteId: note.id }, note.id);
      await this.createAudit(tx, 'ticket.internal_note_created', 'TicketNote', note.id, input.correlationId, {
        actorId: input.authorId,
        actorRole: input.authorRole,
        after: { ticketId, noteId: note.id },
      });

      return note;
    });
  }

  async listInternalNotes(ticketId: string) {
    await this.ensureTicket(ticketId);
    return this.prisma.ticketNote.findMany({ where: { ticketId }, orderBy: { createdAt: 'asc' } });
  }

  async updateInternalNote(ticketId: string, noteId: string, input: UpdateInternalNoteDto) {
    await this.ensureTicket(ticketId);
    const current = await this.prisma.ticketNote.findFirst({ where: { id: noteId, ticketId } });

    if (!current) {
      throw new NotFoundException({ error: 'Internal note not found.' });
    }

    return this.prisma.$transaction(async (tx) => {
      const note = await tx.ticketNote.update({
        where: { id: noteId },
        data: {
          body: input.body,
          editedAt: new Date(),
          ...(input.editedById ? { editedById: input.editedById } : {}),
        },
      });

      await this.createHistory(tx, {
        ticketId,
        action: 'ticket.internal_note_updated',
        before: { body: current.body },
        after: { noteId: note.id, body: note.body },
        actorId: input.editedById,
        actorRole: 'SUPPORT',
        changedById: input.editedById,
        correlationId: input.correlationId,
      });
      await this.createOutbox(tx, 'ticket.internal_note_updated', ticketId, input.correlationId, { ticketId, noteId: note.id }, note.id);
      await this.createAudit(tx, 'ticket.internal_note_updated', 'TicketNote', note.id, input.correlationId, {
        actorId: input.editedById,
        actorRole: 'SUPPORT',
        before: { body: current.body },
        after: { body: note.body },
      });

      return note;
    });
  }

  async assignTicket(ticketId: string, input: AssignTicketDto) {
    const current = await this.ensureTicket(ticketId);

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({
        where: { id: ticketId },
        data: {
          ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
          ...(input.teamId ? { teamId: input.teamId } : {}),
        },
      });

      await this.createHistory(tx, {
        ticketId,
        action: 'ticket.assigned',
        before: { assigneeId: current.assigneeId, teamId: current.teamId },
        after: this.assignmentAfter(input, current.teamId),
        actorId: input.assignedById,
        actorRole: 'SUPPORT',
        changedById: input.assignedById,
        reason: input.reason,
        correlationId: input.correlationId,
      });
      await this.createAssignment(tx, {
        ticketId,
        assigneeId: input.assigneeId,
        assignedById: input.assignedById,
        teamId: input.teamId ?? current.teamId ?? undefined,
        reason: input.reason,
        correlationId: input.correlationId,
      });
      await this.createOutbox(tx, 'ticket.assigned', ticketId, input.correlationId, this.assignmentAfter(input, current.teamId));
      await this.createNotification(tx, {
        ticketId,
        userId: input.assigneeId,
        teamId: input.teamId ?? current.teamId ?? undefined,
        type: 'ticket.assigned',
        title: `Chamado ${current.number} atribuido`,
        body: input.assigneeId ? 'Voce recebeu um chamado.' : 'Um chamado foi atribuido para a equipe.',
        correlationId: input.correlationId,
      });
      await this.createAudit(tx, 'ticket.assigned', 'Ticket', ticketId, input.correlationId, {
        actorId: input.assignedById,
        actorRole: 'SUPPORT',
        before: { assigneeId: current.assigneeId, teamId: current.teamId },
        after: this.assignmentAfter(input, current.teamId),
      });

      return ticket;
    });
  }

  async listNotifications(filters: { userId?: string; teamId?: string; unread?: boolean }) {
    const where: Prisma.NotificationWhereInput = {
      ...(filters.unread ? { readAt: null } : {}),
      ...(filters.userId || filters.teamId
        ? {
            OR: [
              ...(filters.userId ? [{ userId: filters.userId }] : []),
              ...(filters.teamId ? [{ teamId: filters.teamId }] : []),
            ],
          }
        : {}),
    };

    return this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: { ticket: { select: { id: true, number: true, subject: true, status: true, priority: true } } },
    });
  }

  async markNotificationRead(id: string) {
    const current = await this.prisma.notification.findUnique({ where: { id } });

    if (!current) {
      throw new NotFoundException({ error: 'Notification not found.' });
    }

    return this.prisma.notification.update({
      where: { id },
      data: { readAt: current.readAt ?? new Date() },
    });
  }

  async unassignTicket(ticketId: string, input: AssignTicketDto) {
    const current = await this.ensureTicket(ticketId);

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({ where: { id: ticketId }, data: { assigneeId: null } });

      await this.createHistory(tx, {
        ticketId,
        action: 'ticket.unassigned',
        before: { assigneeId: current.assigneeId, teamId: current.teamId },
        after: { assigneeId: null, teamId: current.teamId },
        actorId: input.assignedById,
        actorRole: 'SUPPORT',
        changedById: input.assignedById,
        reason: input.reason,
        correlationId: input.correlationId,
      });
      await this.createAssignment(tx, {
        ticketId,
        assignedById: input.assignedById,
        teamId: current.teamId ?? undefined,
        reason: input.reason ?? 'Unassigned',
        correlationId: input.correlationId,
      });
      await this.createOutbox(tx, 'ticket.unassigned', ticketId, input.correlationId, { ticketId });
      await this.createAudit(tx, 'ticket.unassigned', 'Ticket', ticketId, input.correlationId, {
        actorId: input.assignedById,
        actorRole: 'SUPPORT',
        before: { assigneeId: current.assigneeId },
        after: { assigneeId: null },
      });

      return ticket;
    });
  }

  async changeTeam(ticketId: string, input: AssignTicketDto) {
    const current = await this.ensureTicket(ticketId);

    return this.prisma.$transaction(async (tx) => {
      const ticket = await tx.ticket.update({ where: { id: ticketId }, data: { ...(input.teamId ? { teamId: input.teamId } : { teamId: null }) } });

      await this.createHistory(tx, {
        ticketId,
        action: 'ticket.team_changed',
        before: { teamId: current.teamId },
        after: { teamId: input.teamId ?? null },
        actorId: input.assignedById,
        actorRole: 'SUPPORT',
        changedById: input.assignedById,
        reason: input.reason,
        correlationId: input.correlationId,
      });
      await this.createAssignment(tx, {
        ticketId,
        assigneeId: current.assigneeId ?? undefined,
        assignedById: input.assignedById,
        teamId: input.teamId,
        reason: input.reason ?? 'Team changed',
        correlationId: input.correlationId,
      });
      await this.createOutbox(tx, 'ticket.team_changed', ticketId, input.correlationId, { ticketId, teamId: input.teamId ?? null });
      await this.createAudit(tx, 'ticket.team_changed', 'Ticket', ticketId, input.correlationId, {
        actorId: input.assignedById,
        actorRole: 'SUPPORT',
        before: { teamId: current.teamId },
        after: { teamId: input.teamId ?? null },
      });

      return ticket;
    });
  }

  async listAssignments(ticketId: string) {
    await this.ensureTicket(ticketId);
    return this.prisma.ticketAssignment.findMany({ where: { ticketId }, orderBy: { createdAt: 'asc' } });
  }

  async listAttachments(ticketId: string) {
    await this.ensureTicket(ticketId);
    return this.prisma.ticketAttachment.findMany({ where: { ticketId }, orderBy: { createdAt: 'asc' } });
  }

  async createAttachment(ticketId: string, input: CreateAttachmentDto) {
    await this.ensureTicket(ticketId);

    return this.prisma.$transaction(async (tx) => {
      const attachment = await tx.ticketAttachment.create({
        data: {
          ticketId,
          fileName: input.fileName,
          contentType: input.contentType,
          sizeBytes: input.sizeBytes,
          url: input.url,
          correlationId: input.correlationId,
          ...(input.storageKey ? { storageKey: input.storageKey } : {}),
          ...(input.uploadedById ? { uploadedById: input.uploadedById } : {}),
        },
      });

      await this.createHistory(tx, {
        ticketId,
        action: 'ticket.attachment_created',
        after: { attachmentId: attachment.id, fileName: attachment.fileName, contentType: attachment.contentType },
        actorId: input.uploadedById,
        actorRole: 'SUPPORT',
        changedById: input.uploadedById,
        correlationId: input.correlationId,
      });
      await this.createOutbox(tx, 'ticket.attachment_created', ticketId, input.correlationId, {
        ticketId,
        attachmentId: attachment.id,
        fileName: attachment.fileName,
        contentType: attachment.contentType,
      }, attachment.id);
      await this.createAudit(tx, 'ticket.attachment_created', 'TicketAttachment', attachment.id, input.correlationId, {
        actorId: input.uploadedById,
        actorRole: 'SUPPORT',
        after: { ticketId, attachmentId: attachment.id, fileName: attachment.fileName },
      });

      return attachment;
    });
  }

  listTeams() {
    return this.prisma.supportTeam.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] });
  }

  async createTeam(input: CreateSupportCatalogDto) {
    const team = await this.prisma.supportTeam.create({ data: { name: input.name, ...this.catalogCreateData(input) } });
    await this.auditCatalog('support_team.created', 'SupportTeam', team.id, input);
    return team;
  }

  async updateTeam(id: string, input: UpdateSupportCatalogDto) {
    const current = await this.prisma.supportTeam.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ error: 'Team not found.' });
    const team = await this.prisma.supportTeam.update({ where: { id }, data: this.catalogUpdateData(input) });
    await this.auditCatalog('support_team.updated', 'SupportTeam', team.id, input, current as unknown as Prisma.InputJsonValue);
    return team;
  }

  async deleteTeam(id: string, input: UpdateSupportCatalogDto) {
    const current = await this.prisma.supportTeam.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ error: 'Team not found.' });
    const team = await this.prisma.supportTeam.update({ where: { id }, data: { isActive: false } });
    await this.auditCatalog('support_team.deactivated', 'SupportTeam', team.id, input, current as unknown as Prisma.InputJsonValue);
    return team;
  }

  listCategories() {
    return this.prisma.ticketCategory.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] });
  }

  async createCategory(input: CreateSupportCatalogDto) {
    const category = await this.prisma.ticketCategory.create({ data: { name: input.name, ...this.catalogCreateData(input) } });
    await this.auditCatalog('ticket_category.created', 'TicketCategory', category.id, input);
    return category;
  }

  async updateCategory(id: string, input: UpdateSupportCatalogDto) {
    const current = await this.prisma.ticketCategory.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ error: 'Category not found.' });
    const category = await this.prisma.ticketCategory.update({ where: { id }, data: this.catalogUpdateData(input) });
    await this.auditCatalog('ticket_category.updated', 'TicketCategory', category.id, input, current as unknown as Prisma.InputJsonValue);
    return category;
  }

  async deleteCategory(id: string, input: UpdateSupportCatalogDto) {
    const current = await this.prisma.ticketCategory.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ error: 'Category not found.' });
    const category = await this.prisma.ticketCategory.update({ where: { id }, data: { isActive: false } });
    await this.auditCatalog('ticket_category.deactivated', 'TicketCategory', category.id, input, current as unknown as Prisma.InputJsonValue);
    return category;
  }

  listTags() {
    return this.prisma.ticketTag.findMany({ orderBy: [{ isActive: 'desc' }, { name: 'asc' }] });
  }

  async createTag(input: CreateSupportCatalogDto) {
    const tag = await this.prisma.ticketTag.create({ data: { name: input.name, ...this.catalogCreateData(input), ...(input.color ? { color: input.color } : {}) } });
    await this.auditCatalog('ticket_tag.created', 'TicketTag', tag.id, input);
    return tag;
  }

  async updateTag(id: string, input: UpdateSupportCatalogDto) {
    const current = await this.prisma.ticketTag.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ error: 'Tag not found.' });
    const tag = await this.prisma.ticketTag.update({ where: { id }, data: { ...this.catalogUpdateData(input), ...(input.color ? { color: input.color } : {}) } });
    await this.auditCatalog('ticket_tag.updated', 'TicketTag', tag.id, input, current as unknown as Prisma.InputJsonValue);
    return tag;
  }

  async deleteTag(id: string, input: UpdateSupportCatalogDto) {
    const current = await this.prisma.ticketTag.findUnique({ where: { id } });
    if (!current) throw new NotFoundException({ error: 'Tag not found.' });
    const tag = await this.prisma.ticketTag.update({ where: { id }, data: { isActive: false } });
    await this.auditCatalog('ticket_tag.deactivated', 'TicketTag', tag.id, input, current as unknown as Prisma.InputJsonValue);
    return tag;
  }

  private async ensureTicket(id: string): Promise<TicketWithRelations> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        messages: true,
        notes: true,
        attachments: true,
        history: true,
        assignments: true,
        tagAssignments: { include: { tag: true } },
        team: true,
        categoryRecord: true,
        sla: true,
      },
    });

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

  private optionalTicketCreateData(input: CreateTicketDto) {
    return {
      ...(input.requesterId ? { requesterId: input.requesterId } : {}),
      ...(input.requesterName ? { requesterName: input.requesterName } : {}),
      ...(input.requesterEmail ? { requesterEmail: input.requesterEmail } : {}),
      ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
      ...(input.teamId ? { teamId: input.teamId } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.category ? { category: input.category } : {}),
    };
  }

  private optionalTicketUpdateData(input: UpdateTicketDto): Prisma.TicketUncheckedUpdateInput {
    return {
      ...(input.subject ? { subject: input.subject } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(input.requesterName ? { requesterName: input.requesterName } : {}),
      ...(input.requesterEmail ? { requesterEmail: input.requesterEmail } : {}),
      ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
      ...(input.teamId ? { teamId: input.teamId } : {}),
      ...(input.categoryId ? { categoryId: input.categoryId } : {}),
      ...(input.category ? { category: input.category } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
    };
  }

  private ticketSnapshot(ticket: TicketWithRelations): Prisma.InputJsonValue {
    return {
      id: ticket.id,
      number: ticket.number,
      status: ticket.status,
      priority: ticket.priority,
      assigneeId: ticket.assigneeId,
      teamId: ticket.teamId,
      categoryId: ticket.categoryId,
    };
  }

  private assignmentAfter(input: AssignTicketDto, currentTeamId: string | null): Prisma.InputJsonValue {
    return {
      ticketId: input.correlationId,
      assigneeId: input.assigneeId ?? null,
      teamId: input.teamId ?? currentTeamId,
    };
  }

  private createHistory(tx: Prisma.TransactionClient, input: HistoryInput) {
    return tx.ticketHistory.create({
      data: {
        ticketId: input.ticketId,
        action: input.action,
        correlationId: input.correlationId,
        ...(input.before ? { before: input.before } : {}),
        ...(input.after ? { after: input.after } : {}),
        ...(input.previousStatus ? { previousStatus: input.previousStatus } : {}),
        ...(input.newStatus ? { newStatus: input.newStatus } : {}),
        ...(input.actorId ? { actorId: input.actorId } : {}),
        ...(input.actorRole ? { actorRole: input.actorRole } : {}),
        ...(input.changedById ? { changedById: input.changedById } : {}),
        ...(input.reason ? { reason: input.reason } : {}),
        ...(input.requestId ? { requestId: input.requestId } : {}),
      },
    });
  }

  private createAssignment(
    tx: Prisma.TransactionClient,
    input: {
      ticketId: string;
      correlationId: string;
      assigneeId?: string | undefined;
      assignedById?: string | undefined;
      teamId?: string | undefined;
      reason?: string | undefined;
    },
  ) {
    return tx.ticketAssignment.create({
      data: {
        ticketId: input.ticketId,
        correlationId: input.correlationId,
        ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
        ...(input.assignedById ? { assignedById: input.assignedById } : {}),
        ...(input.teamId ? { teamId: input.teamId } : {}),
        ...(input.reason ? { reason: input.reason } : {}),
      },
    });
  }

  private createNotification(
    tx: Prisma.TransactionClient,
    input: {
      ticketId?: string | undefined;
      userId?: string | undefined;
      teamId?: string | undefined;
      type: string;
      title: string;
      body: string;
      correlationId: string;
    },
  ) {
    if (!input.userId && !input.teamId) {
      return Promise.resolve(null);
    }

    return tx.notification.create({
      data: {
        type: input.type,
        title: input.title,
        body: input.body,
        correlationId: input.correlationId,
        ...(input.ticketId ? { ticketId: input.ticketId } : {}),
        ...(input.userId ? { userId: input.userId } : {}),
        ...(input.teamId ? { teamId: input.teamId } : {}),
      },
    });
  }

  private recordFirstResponse(
    tx: Prisma.TransactionClient,
    ticket: TicketWithRelations,
    input: CreateMessageDto,
  ) {
    if (input.internal || input.authorRole !== 'SUPPORT' || !ticket.sla || ticket.sla.firstRespondedAt) {
      return Promise.resolve(null);
    }

    return tx.ticketSla.update({
      where: { ticketId: ticket.id },
      data: { firstRespondedAt: new Date() },
    });
  }

  private updateSlaForStatusChange(
    tx: Prisma.TransactionClient,
    ticket: TicketWithRelations,
    target: TicketStatus,
  ) {
    if (!ticket.sla) {
      return Promise.resolve(null);
    }

    if (target === 'WAITING_CUSTOMER') {
      return tx.ticketSla.update({
        where: { ticketId: ticket.id },
        data: {
          status: 'PAUSED',
          pausedAt: ticket.sla.pausedAt ?? new Date(),
        },
      });
    }

    if (target === 'IN_PROGRESS' && ticket.sla.pausedAt) {
      const pausedSeconds = Math.max(0, Math.floor((Date.now() - ticket.sla.pausedAt.getTime()) / 1000));
      return tx.ticketSla.update({
        where: { ticketId: ticket.id },
        data: {
          status: 'RUNNING',
          pausedAt: null,
          pausedDurationSeconds: ticket.sla.pausedDurationSeconds + pausedSeconds,
        },
      });
    }

    if (target === 'RESOLVED' || target === 'CLOSED') {
      return tx.ticketSla.update({
        where: { ticketId: ticket.id },
        data: {
          status: 'MET',
          resolvedAt: new Date(),
          pausedAt: null,
        },
      });
    }

    return Promise.resolve(null);
  }

  private createOutbox(
    tx: Prisma.TransactionClient,
    eventType: string,
    aggregateId: string,
    correlationId: string,
    payload: Prisma.InputJsonValue,
    causationId = aggregateId,
  ) {
    return tx.outboxEvent.create({
      data: {
        eventType,
        eventVersion: 1,
        payload,
        correlationId,
        causationId,
      },
    });
  }

  private createAudit(
    tx: Prisma.TransactionClient,
    action: string,
    entityType: string,
    entityId: string,
    correlationId: string,
    input: AuditInput,
  ) {
    return tx.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        correlationId,
        ...(input.actorId ? { actorId: input.actorId } : {}),
        ...(input.actorRole ? { actorRole: input.actorRole } : {}),
        ...(input.before ? { before: input.before } : {}),
        ...(input.after ? { after: input.after } : {}),
        ...(input.requestId ? { requestId: input.requestId } : {}),
      },
    });
  }

  private async auditCatalog(
    action: string,
    entityType: string,
    entityId: string,
    input: CreateSupportCatalogDto | UpdateSupportCatalogDto,
    before?: Prisma.InputJsonValue,
  ) {
    await this.prisma.auditLog.create({
      data: {
        action,
        entityType,
        entityId,
        actorRole: 'SUPPORT',
        after: input as unknown as Prisma.InputJsonValue,
        correlationId: input.correlationId ?? randomUUID(),
        ...(input.actorId ? { actorId: input.actorId } : {}),
        ...(before ? { before } : {}),
      },
    });
  }

  private catalogCreateData(input: CreateSupportCatalogDto) {
    return {
      ...(input.description ? { description: input.description } : {}),
    };
  }

  private catalogUpdateData(input: UpdateSupportCatalogDto) {
    return {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description ? { description: input.description } : {}),
      ...(typeof input.isActive === 'boolean' ? { isActive: input.isActive } : {}),
    };
  }
}
