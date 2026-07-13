import bcrypt from 'bcrypt';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Prisma } from '../generated/prisma';
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
  });

  it('lista entregas com filtros e paginacao para operador', async () => {
    await mockLogin();
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'operator@example.com',
      password: 'secret123',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(operatorUser);
    vi.mocked(prisma.delivery.count).mockResolvedValue(1);
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([baseDelivery]);

    const response = await request(app)
      .get('/api/v1/operations/deliveries?status=PENDING&search=Centro&page=2&pageSize=10')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

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
    await mockLogin(driverUser);
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'driver@example.com',
      password: 'secret123',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(driverUser);

    const response = await request(app)
      .get('/api/v1/operations/deliveries')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ACCESS_DENIED');
  });

  it('atualiza status e registra historico', async () => {
    await mockLogin();
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'operator@example.com',
      password: 'secret123',
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
      .set('Authorization', `Bearer ${login.body.accessToken}`)
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
    await mockLogin();
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'operator@example.com',
      password: 'secret123',
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
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        title: 'Cliente ausente',
        description: 'Nao havia ninguem no local',
        severity: 'HIGH',
      });

    const proof = await request(app)
      .post('/api/v1/operations/deliveries/delivery-1/proofs')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({
        url: 'https://example.com/proof.jpg',
        description: 'Foto da fachada',
      });

    expect(occurrence.status).toBe(201);
    expect(occurrence.body.integrationStatus).toBe('NOT_REQUESTED');
    expect(proof.status).toBe(201);
    expect(proof.body.url).toBe('https://example.com/proof.jpg');
  });

  it('reprocessa apenas ocorrencia em falha permanente ou temporaria', async () => {
    await mockLogin();
    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'operator@example.com',
      password: 'secret123',
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
      .set('Authorization', `Bearer ${login.body.accessToken}`);

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
});
