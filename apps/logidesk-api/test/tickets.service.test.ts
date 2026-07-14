import { ConflictException, UnprocessableEntityException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { TicketsService } from '../src/modules/tickets/tickets.service';

const ticketRecord = {
  id: 'ticket-1',
  number: 'LD-000001',
  subject: 'Entrega com atraso',
  description: 'Motorista reportou bloqueio na doca.',
  status: 'OPEN',
  priority: 'HIGH',
  source: 'LOGIFLOW',
  requesterId: null,
  requesterName: null,
  requesterEmail: 'cliente@empresa.com',
  assigneeId: null,
  teamId: null,
  category: null,
  categoryId: null,
  externalSystem: 'LOGIFLOW',
  externalId: '33333333-3333-4333-8333-333333333333',
  deliveryId: '22222222-2222-4222-8222-222222222222',
  occurrenceId: '33333333-3333-4333-8333-333333333333',
  correlationId: '11111111-1111-4111-8111-111111111111',
  idempotencyKey: 'idem-1',
  canceledAt: null,
  archivedAt: null,
  createdAt: new Date('2026-07-13T00:00:00.000Z'),
  updatedAt: new Date('2026-07-13T00:00:00.000Z'),
  messages: [],
  notes: [],
  attachments: [],
  history: [],
  assignments: [],
  tagAssignments: [],
  team: null,
  categoryRecord: null,
  sla: null,
};

function createTicketsService() {
  const ticketCount = vi.fn().mockResolvedValue(0);
  const ticketFindMany = vi.fn().mockResolvedValue([ticketRecord]);
  const ticketFindUnique = vi.fn().mockResolvedValue(null);
  const ticketCreate = vi.fn().mockResolvedValue(ticketRecord);
  const ticketUpdate = vi.fn().mockImplementation(({ data }) => Promise.resolve({ ...ticketRecord, ...data }));
  const ticketSlaCreate = vi.fn().mockResolvedValue({});
  const ticketSlaUpdate = vi.fn().mockResolvedValue({});
  const ticketHistoryCreate = vi.fn().mockResolvedValue({});
  const ticketAssignmentCreate = vi.fn().mockResolvedValue({});
  const ticketAssignmentFindMany = vi.fn().mockResolvedValue([]);
  const ticketTagAssignmentCreateMany = vi.fn().mockResolvedValue({ count: 1 });
  const ticketTagAssignmentDeleteMany = vi.fn().mockResolvedValue({ count: 1 });
  const idempotencyFindUnique = vi.fn().mockResolvedValue(null);
  const idempotencyUpsert = vi.fn().mockResolvedValue({});
  const outboxCreate = vi.fn().mockResolvedValue({});
  const auditCreate = vi.fn().mockResolvedValue({});
  const notificationCreate = vi.fn().mockResolvedValue({ id: 'notification-1' });
  const notificationFindMany = vi.fn().mockResolvedValue([]);
  const notificationFindUnique = vi.fn().mockResolvedValue({ id: 'notification-1', readAt: null });
  const notificationUpdate = vi.fn().mockResolvedValue({ id: 'notification-1', readAt: new Date('2026-07-14T00:00:00.000Z') });
  const ticketMessageCreate = vi.fn().mockResolvedValue({
    id: 'message-1',
    ticketId: 'ticket-1',
    body: 'Mensagem publica',
    internal: false,
    correlationId: input.correlationId,
  });
  const ticketNoteCreate = vi.fn().mockResolvedValue({
    id: 'note-1',
    ticketId: 'ticket-1',
    body: 'Nota interna',
    correlationId: input.correlationId,
  });
  const ticketNoteFindMany = vi.fn().mockResolvedValue([]);
  const ticketNoteFindFirst = vi.fn().mockResolvedValue({ id: 'note-1', ticketId: 'ticket-1', body: 'Nota interna' });
  const ticketNoteUpdate = vi.fn().mockResolvedValue({ id: 'note-1', ticketId: 'ticket-1', body: 'Nota editada' });
  const ticketAttachmentCreate = vi.fn().mockResolvedValue({
    id: 'attachment-1',
    ticketId: 'ticket-1',
    fileName: 'comprovante.pdf',
    contentType: 'application/pdf',
    sizeBytes: 1024,
    url: 'https://storage.local/comprovante.pdf',
    correlationId: input.correlationId,
  });
  const ticketAttachmentFindMany = vi.fn().mockResolvedValue([]);
  const supportTeamCreate = vi.fn().mockResolvedValue({ id: 'team-1', name: 'Operacoes', isActive: true });
  const supportTeamFindMany = vi.fn().mockResolvedValue([]);
  const supportTeamFindUnique = vi.fn().mockResolvedValue({ id: 'team-1', name: 'Operacoes' });
  const supportTeamUpdate = vi.fn().mockResolvedValue({ id: 'team-1', name: 'Operacoes', isActive: false });
  const ticketCategoryCreate = vi.fn().mockResolvedValue({ id: 'category-1', name: 'Entrega', isActive: true });
  const ticketCategoryFindMany = vi.fn().mockResolvedValue([]);
  const ticketCategoryFindUnique = vi.fn().mockResolvedValue({ id: 'category-1', name: 'Entrega' });
  const ticketCategoryUpdate = vi.fn().mockResolvedValue({ id: 'category-1', name: 'Entrega', isActive: false });
  const ticketTagCreate = vi.fn().mockResolvedValue({ id: 'tag-1', name: 'SLA', isActive: true });
  const ticketTagFindMany = vi.fn().mockResolvedValue([]);
  const ticketTagFindUnique = vi.fn().mockResolvedValue({ id: 'tag-1', name: 'SLA' });
  const ticketTagUpdate = vi.fn().mockResolvedValue({ id: 'tag-1', name: 'SLA', isActive: false });

  const tx = {
    ticket: { create: ticketCreate, update: ticketUpdate },
    ticketSla: { create: ticketSlaCreate, update: ticketSlaUpdate },
    ticketHistory: { create: ticketHistoryCreate },
    ticketAssignment: { create: ticketAssignmentCreate },
    ticketTagAssignment: { createMany: ticketTagAssignmentCreateMany, deleteMany: ticketTagAssignmentDeleteMany },
    idempotencyRecord: { upsert: idempotencyUpsert },
    outboxEvent: { create: outboxCreate },
    auditLog: { create: auditCreate },
    notification: { create: notificationCreate },
    ticketMessage: { create: ticketMessageCreate },
    ticketNote: { create: ticketNoteCreate, update: ticketNoteUpdate },
    ticketAttachment: { create: ticketAttachmentCreate },
  };

  const prisma = {
    ticket: {
      count: ticketCount,
      findMany: ticketFindMany,
      findUnique: ticketFindUnique,
      create: ticketCreate,
      update: ticketUpdate,
    },
    ticketSla: { create: ticketSlaCreate, update: ticketSlaUpdate },
    ticketHistory: { create: ticketHistoryCreate },
    ticketAssignment: { create: ticketAssignmentCreate, findMany: ticketAssignmentFindMany },
    ticketTagAssignment: { createMany: ticketTagAssignmentCreateMany, deleteMany: ticketTagAssignmentDeleteMany },
    idempotencyRecord: { findUnique: idempotencyFindUnique },
    outboxEvent: { create: outboxCreate },
    auditLog: { create: auditCreate },
    notification: {
      create: notificationCreate,
      findMany: notificationFindMany,
      findUnique: notificationFindUnique,
      update: notificationUpdate,
    },
    ticketMessage: { create: ticketMessageCreate },
    ticketNote: {
      create: ticketNoteCreate,
      findMany: ticketNoteFindMany,
      findFirst: ticketNoteFindFirst,
      update: ticketNoteUpdate,
    },
    ticketAttachment: {
      create: ticketAttachmentCreate,
      findMany: ticketAttachmentFindMany,
    },
    supportTeam: {
      create: supportTeamCreate,
      findMany: supportTeamFindMany,
      findUnique: supportTeamFindUnique,
      update: supportTeamUpdate,
    },
    ticketCategory: {
      create: ticketCategoryCreate,
      findMany: ticketCategoryFindMany,
      findUnique: ticketCategoryFindUnique,
      update: ticketCategoryUpdate,
    },
    ticketTag: {
      create: ticketTagCreate,
      findMany: ticketTagFindMany,
      findUnique: ticketTagFindUnique,
      update: ticketTagUpdate,
    },
    $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
  };

  return {
    service: new TicketsService(prisma as never),
    prisma,
    ticketCount,
    ticketFindMany,
    ticketFindUnique,
    ticketCreate,
    ticketUpdate,
    ticketSlaCreate,
    ticketSlaUpdate,
    ticketHistoryCreate,
    ticketAssignmentCreate,
    ticketTagAssignmentCreateMany,
    idempotencyFindUnique,
    idempotencyUpsert,
    outboxCreate,
    auditCreate,
    notificationCreate,
    notificationFindMany,
    notificationFindUnique,
    notificationUpdate,
    ticketMessageCreate,
    ticketNoteCreate,
    ticketNoteFindMany,
    ticketNoteUpdate,
    ticketAttachmentCreate,
    ticketAttachmentFindMany,
    supportTeamCreate,
    ticketCategoryCreate,
    ticketTagCreate,
  };
}

const input = {
  deliveryId: '22222222-2222-4222-8222-222222222222',
  occurrenceId: '33333333-3333-4333-8333-333333333333',
  subject: 'Entrega com atraso',
  description: 'Motorista reportou bloqueio na doca.',
  priority: 'HIGH' as const,
  requesterEmail: 'cliente@empresa.com',
  correlationId: '11111111-1111-4111-8111-111111111111',
};

const manualTicketInput = {
  subject: 'Cliente sem comprovante',
  description: 'Cliente solicitou segunda via do comprovante.',
  priority: 'MEDIUM' as const,
  requesterName: 'Maria Cliente',
  requesterEmail: 'maria@empresa.com',
  teamId: 'team-1',
  assigneeId: 'agent-1',
  categoryId: 'category-1',
  tagIds: ['tag-1'],
  correlationId: '44444444-4444-4444-8444-444444444444',
  actorId: 'agent-1',
};

describe('TicketsService', () => {
  it('creates a LogiDesk ticket from a LogiFlow occurrence with idempotency and outbox event', async () => {
    const context = createTicketsService();

    await expect(context.service.createFromLogiflow(input, 'idem-1')).resolves.toMatchObject({
      id: 'ticket-1',
      number: 'LD-000001',
      status: 'OPEN',
    });

    expect(context.ticketCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'LOGIFLOW',
          externalSystem: 'LOGIFLOW',
          externalId: input.occurrenceId,
          deliveryId: input.deliveryId,
          occurrenceId: input.occurrenceId,
          idempotencyKey: 'idem-1',
        }),
      }),
    );
    expect(context.idempotencyUpsert).toHaveBeenCalled();
    expect(context.outboxCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          eventType: 'ticket.created',
          correlationId: input.correlationId,
        }),
      }),
    );
    expect(context.auditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ticket.created_from_logiflow',
          entityType: 'Ticket',
        }),
      }),
    );
  });

  it('returns an existing ticket when the same idempotency key is replayed with the same payload', async () => {
    const context = createTicketsService();
    context.idempotencyFindUnique.mockResolvedValue({
      key: 'idem-1',
      requestHash: 'same-hash',
      responseRef: 'ticket-existing',
    });
    vi.spyOn(context.service as unknown as { hash: (value: unknown) => string }, 'hash').mockReturnValue('same-hash');
    context.ticketFindUnique.mockResolvedValue({ id: 'ticket-existing', number: 'LD-000001' });

    await expect(context.service.createFromLogiflow(input, 'idem-1')).resolves.toMatchObject({ id: 'ticket-existing' });
    expect(context.ticketCreate).not.toHaveBeenCalled();
  });

  it('rejects idempotency key reuse with a different payload', async () => {
    const context = createTicketsService();
    context.idempotencyFindUnique.mockResolvedValue({
      key: 'idem-1',
      requestHash: 'previous-hash',
      responseRef: 'ticket-existing',
    });

    await expect(context.service.createFromLogiflow(input, 'idem-1')).rejects.toThrow(ConflictException);
  });

  it('creates a manual operational ticket with SLA, assignment, tags, history, audit and outbox', async () => {
    const context = createTicketsService();

    await expect(context.service.createTicket(manualTicketInput)).resolves.toMatchObject({ id: 'ticket-1' });

    expect(context.ticketCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          source: 'LOGIDESK',
          requesterName: 'Maria Cliente',
          teamId: 'team-1',
          assigneeId: 'agent-1',
          categoryId: 'category-1',
        }),
      }),
    );
    expect(context.ticketSlaCreate).toHaveBeenCalled();
    expect(context.ticketAssignmentCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ assigneeId: 'agent-1' }) }));
    expect(context.ticketTagAssignmentCreateMany).toHaveBeenCalledWith(expect.objectContaining({ data: [{ ticketId: 'ticket-1', tagId: 'tag-1' }] }));
    expect(context.ticketHistoryCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ticket.created' }) }));
    expect(context.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ticket.created' }) }));
    expect(context.outboxCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ eventType: 'ticket.created' }) }));
  });

  it('lists, details and updates tickets without exposing internal messages as public messages', async () => {
    const context = createTicketsService();
    const publicTicketRecord = { ...ticketRecord } as Partial<typeof ticketRecord>;
    delete publicTicketRecord.notes;
    context.ticketFindUnique
      .mockResolvedValueOnce({ ...ticketRecord, messages: [{ id: 'message-public', internal: false }], notes: [{ id: 'note-1' }] })
      .mockResolvedValueOnce({ ...publicTicketRecord, messages: [{ id: 'message-public', internal: false }] })
      .mockResolvedValueOnce(ticketRecord);

    await expect(context.service.listTickets({ status: 'OPEN', priority: 'HIGH', search: 'Entrega' })).resolves.toHaveLength(1);
    await expect(context.service.getTicket('ticket-1')).resolves.toMatchObject({ id: 'ticket-1', notes: [{ id: 'note-1' }] });
    await expect(context.service.getPublicTicket('ticket-1')).resolves.not.toHaveProperty('notes');
    await expect(context.service.updateTicket('ticket-1', { priority: 'URGENT', correlationId: input.correlationId })).resolves.toMatchObject({ priority: 'URGENT' });

    expect(context.ticketUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ priority: 'URGENT' }) }));
    expect(context.ticketHistoryCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ticket.updated' }) }));
  });

  it('enforces ticket status transition rules and records valid status changes', async () => {
    const context = createTicketsService();
    context.ticketFindUnique.mockResolvedValue({ ...ticketRecord, status: 'OPEN' });

    await expect(context.service.changeStatus('ticket-1', { status: 'RESOLVED', correlationId: input.correlationId })).rejects.toThrow(UnprocessableEntityException);
    await expect(context.service.changeStatus('ticket-1', { status: 'IN_PROGRESS', correlationId: input.correlationId, reason: 'Inicio do atendimento' })).resolves.toMatchObject({ status: 'IN_PROGRESS' });

    expect(context.ticketHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ticket.status_changed',
          previousStatus: 'OPEN',
          newStatus: 'IN_PROGRESS',
        }),
      }),
    );
  });

  it('updates SLA lifecycle on pause, resume, resolution and first response', async () => {
    const context = createTicketsService();
    const sla = {
      id: 'sla-1',
      ticketId: 'ticket-1',
      status: 'RUNNING',
      firstResponseDueAt: new Date('2026-07-14T10:00:00.000Z'),
      resolutionDueAt: new Date('2026-07-14T18:00:00.000Z'),
      firstRespondedAt: null,
      resolvedAt: null,
      pausedAt: null,
      pausedDurationSeconds: 0,
      warningEmittedAt: null,
      breachedAt: null,
      createdAt: new Date('2026-07-14T00:00:00.000Z'),
      updatedAt: new Date('2026-07-14T00:00:00.000Z'),
    };

    context.ticketFindUnique.mockResolvedValueOnce({ ...ticketRecord, status: 'IN_PROGRESS', sla });
    await context.service.changeStatus('ticket-1', { status: 'WAITING_CUSTOMER', correlationId: input.correlationId });
    expect(context.ticketSlaUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { ticketId: 'ticket-1' },
      data: expect.objectContaining({ status: 'PAUSED', pausedAt: expect.any(Date) }),
    }));

    context.ticketFindUnique.mockResolvedValueOnce({
      ...ticketRecord,
      status: 'WAITING_CUSTOMER',
      sla: { ...sla, status: 'PAUSED', pausedAt: new Date(Date.now() - 3000) },
    });
    await context.service.changeStatus('ticket-1', { status: 'IN_PROGRESS', correlationId: input.correlationId });
    expect(context.ticketSlaUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { ticketId: 'ticket-1' },
      data: expect.objectContaining({ status: 'RUNNING', pausedAt: null, pausedDurationSeconds: expect.any(Number) }),
    }));

    context.ticketFindUnique.mockResolvedValueOnce({ ...ticketRecord, status: 'IN_PROGRESS', sla });
    await context.service.changeStatus('ticket-1', { status: 'RESOLVED', correlationId: input.correlationId });
    expect(context.ticketSlaUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { ticketId: 'ticket-1' },
      data: expect.objectContaining({ status: 'MET', resolvedAt: expect.any(Date), pausedAt: null }),
    }));

    context.ticketFindUnique.mockResolvedValueOnce({ ...ticketRecord, status: 'IN_PROGRESS', sla });
    await context.service.createMessage('ticket-1', {
      body: 'Resposta ao cliente',
      authorRole: 'SUPPORT',
      authorId: 'agent-1',
      correlationId: input.correlationId,
    });
    expect(context.ticketSlaUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { ticketId: 'ticket-1' },
      data: expect.objectContaining({ firstRespondedAt: expect.any(Date) }),
    }));
  });

  it('changes priority, assignment, team and unassignment with history and outbox', async () => {
    const context = createTicketsService();
    context.ticketFindUnique.mockResolvedValue({ ...ticketRecord, status: 'IN_PROGRESS', assigneeId: 'old-agent', teamId: 'old-team' });

    await context.service.changePriority('ticket-1', { priority: 'URGENT', correlationId: input.correlationId, reason: 'SLA critico' });
    await context.service.assignTicket('ticket-1', { assigneeId: 'agent-2', assignedById: 'lead-1', teamId: 'team-1', correlationId: input.correlationId });
    await context.service.changeTeam('ticket-1', { teamId: 'team-2', assignedById: 'lead-1', correlationId: input.correlationId });
    await context.service.unassignTicket('ticket-1', { assignedById: 'lead-1', correlationId: input.correlationId });

    expect(context.ticketHistoryCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ticket.priority_changed' }) }));
    expect(context.ticketHistoryCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ticket.assigned' }) }));
    expect(context.ticketHistoryCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ticket.team_changed' }) }));
    expect(context.ticketHistoryCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ticket.unassigned' }) }));
    expect(context.outboxCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ eventType: 'ticket.priority_changed' }) }));
    expect(context.notificationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        ticketId: 'ticket-1',
        userId: 'agent-2',
        teamId: 'team-1',
        type: 'ticket.assigned',
      }),
    }));
  });

  it('lists unread notifications and marks a notification as read', async () => {
    const context = createTicketsService();
    context.notificationFindMany.mockResolvedValue([{ id: 'notification-1', readAt: null }]);

    await expect(context.service.listNotifications({ userId: 'agent-1', unread: true })).resolves.toHaveLength(1);
    expect(context.notificationFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        readAt: null,
        OR: [{ userId: 'agent-1' }],
      }),
      take: 100,
    }));

    await expect(context.service.markNotificationRead('notification-1')).resolves.toMatchObject({ id: 'notification-1' });
    expect(context.notificationUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'notification-1' },
      data: expect.objectContaining({ readAt: expect.any(Date) }),
    }));
  });

  it('creates and edits internal notes without adding them to public ticket messages', async () => {
    const context = createTicketsService();
    context.ticketFindUnique.mockResolvedValue(ticketRecord);

    await context.service.createNote('ticket-1', { body: 'Nota interna', authorRole: 'SUPPORT', authorId: 'agent-1', correlationId: input.correlationId });
    await context.service.updateInternalNote('ticket-1', 'note-1', { body: 'Nota editada', editedById: 'agent-2', correlationId: input.correlationId });
    await context.service.listInternalNotes('ticket-1');

    expect(context.ticketNoteCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ body: 'Nota interna' }) }));
    expect(context.ticketNoteUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ body: 'Nota editada' }) }));
    expect(context.ticketMessageCreate).not.toHaveBeenCalled();
  });

  it('lists and creates attachments with history, outbox and audit', async () => {
    const context = createTicketsService();
    context.ticketFindUnique.mockResolvedValue(ticketRecord);
    context.ticketAttachmentFindMany.mockResolvedValue([{ id: 'attachment-1', ticketId: 'ticket-1' }]);

    await expect(context.service.listAttachments('ticket-1')).resolves.toHaveLength(1);
    await expect(context.service.createAttachment('ticket-1', {
      fileName: 'comprovante.pdf',
      contentType: 'application/pdf',
      sizeBytes: 1024,
      url: 'https://storage.local/comprovante.pdf',
      uploadedById: 'agent-1',
      correlationId: input.correlationId,
    })).resolves.toMatchObject({ id: 'attachment-1' });

    expect(context.ticketAttachmentCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        ticketId: 'ticket-1',
        fileName: 'comprovante.pdf',
        uploadedById: 'agent-1',
      }),
    }));
    expect(context.ticketHistoryCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ticket.attachment_created' }) }));
    expect(context.outboxCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ eventType: 'ticket.attachment_created' }) }));
    expect(context.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ticket.attachment_created' }) }));
  });

  it('creates and deactivates support teams, categories and tags with audit', async () => {
    const context = createTicketsService();

    await context.service.createTeam({ name: 'Operacoes', correlationId: input.correlationId });
    await context.service.createCategory({ name: 'Entrega', correlationId: input.correlationId });
    await context.service.createTag({ name: 'SLA', color: '#f97316', correlationId: input.correlationId });
    await context.service.deleteTeam('team-1', { correlationId: input.correlationId });
    await context.service.deleteCategory('category-1', { correlationId: input.correlationId });
    await context.service.deleteTag('tag-1', { correlationId: input.correlationId });

    expect(context.supportTeamCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'Operacoes' }) }));
    expect(context.ticketCategoryCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'Entrega' }) }));
    expect(context.ticketTagCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ name: 'SLA' }) }));
    expect(context.auditCreate).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ticket_tag.deactivated' }) }));
  });
});
