import bcrypt from 'bcrypt';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../generated/prisma';
import { signAccessToken } from '../lib/auth-tokens';
import { prisma } from '../lib/prisma';
import { routes } from '../routes';

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    refreshSession: {
      create: vi.fn(),
    },
    delivery: {
      count: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deliveryStatusHistory: {
      create: vi.fn(),
    },
    occurrence: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    deliveryProof: {
      create: vi.fn(),
    },
    outboxEvent: {
      findUnique: vi.fn(),
      update: vi.fn(),
      upsert: vi.fn(),
    },
    deadLetterEvent: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (tx: typeof prisma) => unknown) => callback(prisma)),
  },
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(routes);
  return app;
}

const operatorUser = {
  id: 'operator-1',
  name: 'Operador',
  email: 'operator@example.com',
  passwordHash: '',
  role: 'OPERATOR',
  status: 'ACTIVE',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const driverUser = {
  ...operatorUser,
  id: 'driver-user-1',
  email: 'driver@example.com',
  role: 'DRIVER',
};

const baseDelivery = {
  id: 'delivery-1',
  description: 'Entrega Centro',
  pickupAddress: 'Loja',
  deliveryAddress: 'Cliente',
  price: new Prisma.Decimal(0),
  status: 'PENDING',
  proofUrl: null,
  driverId: 'driver-1',
  vehicleId: 'vehicle-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

async function mockLogin(user = operatorUser) {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    ...user,
    passwordHash: await bcrypt.hash('secret123', 4),
  });
  vi.mocked(prisma.refreshSession.create).mockResolvedValue({
    id: 'session-1',
    userId: user.id,
    tokenHash: 'hash',
    userAgent: null,
    ipHash: null,
    expiresAt: new Date('2026-01-08T00:00:00.000Z'),
    revokedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    replacedById: null,
  });
}

describe('LogiFlow operacional v1', () => {
  const app = createTestApp();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_ISSUER = 'logiflow-identity';
    process.env.JWT_AUDIENCE = 'logiflow,logidesk';
    process.env.LOGIDESK_SERVICE_TOKEN = 'service-token';
  });

  it('lista entregas com filtros e paginacao para operador', async () => {

    const operatorToken = signAccessToken({
      sub: 'operator-1',
      email: 'operator@example.com',
      name: 'Operador',
      roles: ['OPERATOR'],
      status: 'ACTIVE',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(operatorUser);
    vi.mocked(prisma.delivery.count).mockResolvedValue(1);
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([baseDelivery]);

    const response = await request(app)
      .get('/api/v1/operations/deliveries?status=PENDING&search=Centro&page=2&pageSize=10')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(response.status).toBe(200);
    expect(response.body.pagination).toMatchObject({ page: 2, pageSize: 10, total: 1, totalPages: 1 });
    expect(prisma.delivery.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        status: 'PENDING',
        OR: expect.any(Array),
      }),
      skip: 10,
      take: 10,
    }));
  });

  it('bloqueia motorista em endpoint operacional', async () => {

    const driverToken = signAccessToken({
      sub: 'driver-user-1',
      email: 'driver@example.com',
      name: 'Driver',
      roles: ['DRIVER'],
      status: 'ACTIVE',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(driverUser);

    const response = await request(app)
      .get('/api/v1/operations/deliveries')
      .set('Authorization', `Bearer ${driverToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ACCESS_DENIED');
  });

  it('atualiza status e registra historico', async () => {

    const operatorToken = signAccessToken({
      sub: 'operator-1',
      email: 'operator@example.com',
      name: 'Operador',
      roles: ['OPERATOR'],
      status: 'ACTIVE',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(operatorUser);
    vi.mocked(prisma.delivery.findUnique).mockResolvedValue(baseDelivery);
    vi.mocked(prisma.delivery.update).mockResolvedValue({ ...baseDelivery, status: 'IN_TRANSIT' });
    vi.mocked(prisma.deliveryStatusHistory.create).mockResolvedValue({
      id: 'history-1',
      deliveryId: 'delivery-1',
      previousStatus: 'PENDING',
      newStatus: 'IN_TRANSIT',
      changedByUserId: 'operator-1',
      reason: 'Saiu para rota',
      requestId: 'req-1',
      correlationId: 'corr-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await request(app)
      .patch('/api/v1/operations/deliveries/delivery-1/status')
      .set('Authorization', `Bearer ${operatorToken}`)
      .set('x-request-id', 'req-1')
      .set('x-correlation-id', 'corr-1')
      .send({ status: 'IN_TRANSIT', reason: 'Saiu para rota' });

    expect(response.status).toBe(200);
    expect(prisma.deliveryStatusHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        previousStatus: 'PENDING',
        newStatus: 'IN_TRANSIT',
        changedByUserId: 'operator-1',
        requestId: 'req-1',
        correlationId: 'corr-1',
      }),
    });
  });

  it('cria ocorrencia e comprovante na entrega', async () => {

    const operatorToken = signAccessToken({
      sub: 'operator-1',
      email: 'operator@example.com',
      name: 'Operador',
      roles: ['OPERATOR'],
      status: 'ACTIVE',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(operatorUser);
    vi.mocked(prisma.delivery.findUnique).mockResolvedValue(baseDelivery);
    vi.mocked(prisma.occurrence.create).mockResolvedValue({
      id: 'occurrence-1',
      deliveryId: 'delivery-1',
      title: 'Cliente ausente',
      description: 'Nao havia ninguem no local',
      severity: 'HIGH',
      status: 'OPEN',
      integrationStatus: 'NOT_REQUESTED',
      retryCount: 0,
      lastError: null,
      ticketNumber: null,
      createdByUserId: 'operator-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    vi.mocked(prisma.deliveryProof.create).mockResolvedValue({
      id: 'proof-1',
      deliveryId: 'delivery-1',
      type: 'PHOTO',
      url: 'https://example.com/proof.jpg',
      description: 'Foto da fachada',
      uploadedByUserId: 'operator-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const occurrence = await request(app)
      .post('/api/v1/operations/deliveries/delivery-1/occurrences')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        title: 'Cliente ausente',
        description: 'Nao havia ninguem no local',
        severity: 'HIGH',
      });

    const proof = await request(app)
      .post('/api/v1/operations/deliveries/delivery-1/proofs')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        url: 'https://example.com/proof.jpg',
        description: 'Foto da fachada',
      });

    expect(occurrence.status).toBe(201);
    expect(occurrence.body.integrationStatus).toBe('NOT_REQUESTED');
    expect(proof.status).toBe(201);
    expect(proof.body.url).toBe('https://example.com/proof.jpg');
  });

  it('nao cria ocorrencia com severidade invalida', async () => {

    const operatorToken = signAccessToken({
      sub: 'operator-1',
      email: 'operator@example.com',
      name: 'Operador',
      roles: ['OPERATOR'],
      status: 'ACTIVE',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(operatorUser);

    const response = await request(app)
      .post('/api/v1/operations/deliveries/delivery-1/occurrences')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        title: 'Cliente ausente',
        description: 'Nao havia ninguem no local',
        severity: 'INVALID',
      });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(prisma.occurrence.create).not.toHaveBeenCalled();
  });

  it('nao registra comprovante sem URL', async () => {

    const operatorToken = signAccessToken({
      sub: 'operator-1',
      email: 'operator@example.com',
      name: 'Operador',
      roles: ['OPERATOR'],
      status: 'ACTIVE',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(operatorUser);

    const response = await request(app)
      .post('/api/v1/operations/deliveries/delivery-1/proofs')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({ description: 'Sem URL' });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(prisma.deliveryProof.create).not.toHaveBeenCalled();
  });

  it('reprocessa apenas ocorrencia em falha permanente ou temporaria', async () => {

    const operatorToken = signAccessToken({
      sub: 'operator-1',
      email: 'operator@example.com',
      name: 'Operador',
      roles: ['OPERATOR'],
      status: 'ACTIVE',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(operatorUser);
    vi.mocked(prisma.occurrence.findUnique).mockResolvedValue({
      id: 'occurrence-1',
      deliveryId: 'delivery-1',
      title: 'Falha integracao',
      description: 'Timeout',
      severity: 'HIGH',
      status: 'OPEN',
      integrationStatus: 'FAILED',
      retryCount: 2,
      lastError: 'Timeout',
      ticketNumber: null,
      createdByUserId: 'operator-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    vi.mocked(prisma.occurrence.update).mockResolvedValue({
      id: 'occurrence-1',
      deliveryId: 'delivery-1',
      title: 'Falha integracao',
      description: 'Timeout',
      severity: 'HIGH',
      status: 'OPEN',
      integrationStatus: 'PENDING',
      retryCount: 3,
      lastError: null,
      ticketNumber: null,
      createdByUserId: 'operator-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await request(app)
      .post('/api/v1/operations/occurrences/occurrence-1/reprocess')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(response.status).toBe(200);
    expect(prisma.occurrence.update).toHaveBeenCalledWith({
      where: { id: 'occurrence-1' },
      data: {
        integrationStatus: 'PENDING',
        retryCount: { increment: 1 },
        lastError: null,
      },
    });
  });

  it('bloqueia reprocessamento de ocorrencia que nao esta em falha', async () => {

    const operatorToken = signAccessToken({
      sub: 'operator-1',
      email: 'operator@example.com',
      name: 'Operador',
      roles: ['OPERATOR'],
      status: 'ACTIVE',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(operatorUser);
    vi.mocked(prisma.occurrence.findUnique).mockResolvedValue({
      id: 'occurrence-1',
      deliveryId: 'delivery-1',
      title: 'Em processamento',
      description: 'Aguardando worker',
      severity: 'MEDIUM',
      status: 'OPEN',
      integrationStatus: 'PROCESSING',
      retryCount: 0,
      lastError: null,
      ticketNumber: null,
      createdByUserId: 'operator-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await request(app)
      .post('/api/v1/operations/occurrences/occurrence-1/reprocess')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INTEGRATION_UNAVAILABLE');
    expect(prisma.occurrence.update).not.toHaveBeenCalled();
  });

  it('lista e reprocessa DLQ operacional recolocando outbox e ocorrencia na fila', async () => {

    const operatorToken = signAccessToken({
      sub: 'operator-1',
      email: 'operator@example.com',
      name: 'Operador',
      roles: ['OPERATOR'],
      status: 'ACTIVE',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(operatorUser);
    vi.mocked(prisma.deadLetterEvent.findMany).mockResolvedValue([
      {
        id: 'dead-letter-1',
        outboxEventId: 'outbox-1',
        eventType: 'logiflow.occurrence.escalated',
        payload: { occurrenceId: 'occurrence-1' },
        error: 'LogiDesk unavailable',
        correlationId: 'corr-1',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);
    vi.mocked(prisma.deadLetterEvent.findUnique).mockResolvedValue({
      id: 'dead-letter-1',
      outboxEventId: 'outbox-1',
      eventType: 'logiflow.occurrence.escalated',
      payload: { occurrenceId: 'occurrence-1' },
      error: 'LogiDesk unavailable',
      correlationId: 'corr-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    vi.mocked(prisma.outboxEvent.findUnique).mockResolvedValue({
      id: 'outbox-1',
      eventType: 'logiflow.occurrence.escalated',
      eventVersion: 1,
      payload: { occurrenceId: 'occurrence-1' },
      status: 'DEAD_LETTER',
      attempts: 5,
      lastError: 'LogiDesk unavailable',
      correlationId: 'corr-1',
      causationId: 'occurrence-1',
      idempotencyKey: 'logiflow:occurrence:occurrence-1:ticket',
      processedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    vi.mocked(prisma.outboxEvent.update).mockResolvedValue({
      id: 'outbox-1',
      eventType: 'logiflow.occurrence.escalated',
      eventVersion: 1,
      payload: { occurrenceId: 'occurrence-1' },
      status: 'PENDING',
      attempts: 0,
      lastError: null,
      correlationId: 'corr-1',
      causationId: 'occurrence-1',
      idempotencyKey: 'logiflow:occurrence:occurrence-1:ticket',
      processedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    vi.mocked(prisma.occurrence.update).mockResolvedValue({
      id: 'occurrence-1',
      deliveryId: 'delivery-1',
      title: 'Falha integracao',
      description: 'Timeout',
      severity: 'HIGH',
      status: 'OPEN',
      integrationStatus: 'PENDING',
      retryCount: 3,
      lastError: null,
      ticketNumber: null,
      createdByUserId: 'operator-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const list = await request(app)
      .get('/api/v1/operations/dead-letter-events?correlationId=corr-1')
      .set('Authorization', `Bearer ${operatorToken}`);
    const reprocess = await request(app)
      .post('/api/v1/operations/dead-letter-events/dead-letter-1/reprocess')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);
    expect(prisma.deadLetterEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { correlationId: 'corr-1' },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }));
    expect(reprocess.status).toBe(200);
    expect(prisma.outboxEvent.update).toHaveBeenCalledWith({
      where: { id: 'outbox-1' },
      data: {
        status: 'PENDING',
        attempts: 0,
        lastError: null,
        processedAt: null,
      },
    });
    expect(prisma.occurrence.update).toHaveBeenCalledWith({
      where: { id: 'occurrence-1' },
      data: {
        integrationStatus: 'PENDING',
        lastError: null,
      },
    });
  });

  it('bloqueia reprocessamento de DLQ quando o outbox vinculado nao esta em dead-letter', async () => {

    const operatorToken = signAccessToken({
      sub: 'operator-1',
      email: 'operator@example.com',
      name: 'Operador',
      roles: ['OPERATOR'],
      status: 'ACTIVE',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(operatorUser);
    vi.mocked(prisma.deadLetterEvent.findUnique).mockResolvedValue({
      id: 'dead-letter-1',
      outboxEventId: 'outbox-1',
      eventType: 'logiflow.occurrence.escalated',
      payload: { occurrenceId: 'occurrence-1' },
      error: 'LogiDesk unavailable',
      correlationId: 'corr-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    vi.mocked(prisma.outboxEvent.findUnique).mockResolvedValue({
      id: 'outbox-1',
      eventType: 'logiflow.occurrence.escalated',
      eventVersion: 1,
      payload: { occurrenceId: 'occurrence-1' },
      status: 'PENDING',
      attempts: 0,
      lastError: null,
      correlationId: 'corr-1',
      causationId: 'occurrence-1',
      idempotencyKey: 'logiflow:occurrence:occurrence-1:ticket',
      processedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await request(app)
      .post('/api/v1/operations/dead-letter-events/dead-letter-1/reprocess')
      .set('Authorization', `Bearer ${operatorToken}`);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('INTEGRATION_UNAVAILABLE');
    expect(prisma.outboxEvent.update).not.toHaveBeenCalled();
  });

  it('escala ocorrencia para o LogiDesk criando outbox idempotente', async () => {

    const operatorToken = signAccessToken({
      sub: 'operator-1',
      email: 'operator@example.com',
      name: 'Operador',
      roles: ['OPERATOR'],
      status: 'ACTIVE',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(operatorUser);
    vi.mocked(prisma.occurrence.findUnique).mockResolvedValue({
      id: 'occurrence-1',
      deliveryId: 'delivery-1',
      title: 'Atraso critico',
      description: 'Bloqueio na doca',
      severity: 'CRITICAL',
      status: 'OPEN',
      integrationStatus: 'FAILED',
      retryCount: 1,
      lastError: 'Timeout',
      ticketNumber: null,
      createdByUserId: 'operator-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
      delivery: {
        ...baseDelivery,
        driver: { id: 'driver-1', name: 'Driver', email: 'driver@example.com' },
        vehicle: { id: 'vehicle-1', plate: 'ABC1234', model: 'Van' },
      },
    } as never);
    vi.mocked(prisma.occurrence.update).mockResolvedValue({
      id: 'occurrence-1',
      deliveryId: 'delivery-1',
      title: 'Atraso critico',
      description: 'Bloqueio na doca',
      severity: 'CRITICAL',
      status: 'OPEN',
      integrationStatus: 'PENDING',
      retryCount: 2,
      lastError: null,
      ticketNumber: null,
      createdByUserId: 'operator-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    vi.mocked(prisma.outboxEvent.upsert).mockResolvedValue({
      id: 'outbox-1',
      eventType: 'logiflow.occurrence.escalated',
      eventVersion: 1,
      payload: {},
      status: 'PENDING',
      attempts: 0,
      lastError: null,
      correlationId: '11111111-1111-4111-8111-111111111111',
      causationId: 'occurrence-1',
      idempotencyKey: 'logiflow:occurrence:occurrence-1:ticket',
      processedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await request(app)
      .post('/api/v1/operations/occurrences/occurrence-1/escalate')
      .set('Authorization', `Bearer ${operatorToken}`)
      .set('x-correlation-id', '11111111-1111-4111-8111-111111111111');

    expect(response.status).toBe(202);
    expect(prisma.occurrence.update).toHaveBeenCalledWith({
      where: { id: 'occurrence-1' },
      data: {
        integrationStatus: 'PENDING',
        retryCount: { increment: 1 },
        lastError: null,
      },
    });
    expect(prisma.outboxEvent.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { idempotencyKey: 'logiflow:occurrence:occurrence-1:ticket' },
      create: expect.objectContaining({
        eventType: 'logiflow.occurrence.escalated',
        correlationId: '11111111-1111-4111-8111-111111111111',
        payload: expect.objectContaining({
          priority: 'URGENT',
          occurrenceId: 'occurrence-1',
        }),
      }),
    }));
  });

  it('recebe atualizacao de ticket do LogiDesk por token de servico', async () => {
    vi.mocked(prisma.occurrence.update).mockResolvedValue({
      id: 'occurrence-1',
      deliveryId: 'delivery-1',
      title: 'Atraso critico',
      description: 'Bloqueio na doca',
      severity: 'CRITICAL',
      status: 'OPEN',
      integrationStatus: 'COMPLETED',
      retryCount: 1,
      lastError: null,
      ticketNumber: 'LD-000001',
      createdByUserId: 'operator-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await request(app)
      .post('/api/v1/integrations/logidesk/ticket-updates')
      .set('x-service-token', 'service-token')
      .send({
        eventType: 'logidesk.ticket.created',
        occurrenceId: 'occurrence-1',
        ticketNumber: 'LD-000001',
        status: 'OPEN',
      });

    expect(response.status).toBe(200);
    expect(prisma.occurrence.update).toHaveBeenCalledWith({
      where: { id: 'occurrence-1' },
      data: {
        ticketNumber: 'LD-000001',
        integrationStatus: 'COMPLETED',
        lastError: null,
      },
    });
  });

  it('rejeita atualizacao de ticket do LogiDesk sem token de servico', async () => {
    const response = await request(app)
      .post('/api/v1/integrations/logidesk/ticket-updates')
      .send({
        occurrenceId: 'occurrence-1',
        ticketNumber: 'LD-000001',
      });

    expect(response.status).toBe(401);
    expect(prisma.occurrence.update).not.toHaveBeenCalled();
  });
});
