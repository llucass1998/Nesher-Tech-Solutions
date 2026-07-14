import bcrypt from 'bcrypt';
import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/prisma';
import { routes } from '../routes';
import { Prisma } from '../generated/prisma';

vi.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    driver: {
      create: vi.fn(),
    },
    driverProfile: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    refreshSession: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    delivery: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
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

const driverUser = {
  id: 'user-driver-1',
  name: 'Motorista',
  email: 'driver@example.com',
  passwordHash: '',
  role: 'DRIVER',
  status: 'ACTIVE',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const driverProfile = {
  id: 'driver-profile-1',
  userId: 'user-driver-1',
  driverId: 'driver-1',
  phone: '11999999999',
  document: null,
  status: 'AVAILABLE',
  currentVehicleId: null,
  employeeId: null,
  operationalData: {},
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const ownedDelivery = {
  id: 'delivery-owned',
  description: 'Entrega propria',
  pickupAddress: 'Origem',
  deliveryAddress: 'Destino',
  price: new Prisma.Decimal(0),
  status: 'PENDING',
  proofUrl: null,
  driverId: 'driver-1',
  vehicleId: 'vehicle-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  driver: { id: 'driver-1', name: 'Motorista' },
  vehicle: { id: 'vehicle-1', model: 'Moto', plate: 'ABC1234' },
};

async function mockSuccessfulLogin() {
  vi.mocked(prisma.user.findUnique).mockResolvedValue({
    ...driverUser,
    passwordHash: await bcrypt.hash('secret123', 4),
  });
  vi.mocked(prisma.refreshSession.create).mockResolvedValue({
    id: 'session-1',
    userId: 'user-driver-1',
    tokenHash: 'hash',
    userAgent: null,
    ipHash: null,
    expiresAt: new Date('2026-01-08T00:00:00.000Z'),
    revokedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    replacedById: null,
  });
}

describe('auth versionada e ownership do motorista', () => {
  const app = createTestApp();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.JWT_ISSUER = 'logiflow-identity';
    process.env.JWT_AUDIENCE = 'logiflow,logidesk';
    process.env.ACCESS_TOKEN_TTL_SECONDS = '900';
    process.env.REFRESH_TOKEN_TTL_DAYS = '7';
  });

  it('registra motorista em User e DriverProfile sem retornar hashes', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({
      ...driverUser,
      passwordHash: await bcrypt.hash('secret123', 4),
    });
    vi.mocked(prisma.driver.create).mockResolvedValue({
      id: 'driver-1',
      name: 'Motorista',
      email: 'driver@example.com',
      password: await bcrypt.hash('secret123', 4),
      phone: '11999999999',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      status: 'AVAILABLE',
    });
    vi.mocked(prisma.driverProfile.create).mockResolvedValue(driverProfile);
    vi.mocked(prisma.refreshSession.create).mockResolvedValue({
      id: 'session-1',
      userId: 'user-driver-1',
      tokenHash: 'hash',
      userAgent: null,
      ipHash: null,
      expiresAt: new Date('2026-01-08T00:00:00.000Z'),
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      replacedById: null,
    });

    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Motorista',
      email: 'driver@example.com',
      password: 'secret123',
      phone: '11999999999',
      role: 'DRIVER',
    });

    expect(response.status).toBe(201);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      id: 'user-driver-1',
      email: 'driver@example.com',
      roles: ['DRIVER'],
      status: 'ACTIVE',
    });
    expect(response.body.user).not.toHaveProperty('passwordHash');
    expect(response.body).not.toHaveProperty('refreshToken');
    const setCookie = response.headers['set-cookie'];
    const cookieHeader = Array.isArray(setCookie) ? setCookie.join(';') : String(setCookie);
    expect(cookieHeader).toContain('refreshToken=');
  });

  it('registro com email duplicado retorna 409', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(driverUser);

    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Motorista',
      email: 'driver@example.com',
      password: 'secret123',
      role: 'DRIVER',
    });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('DUPLICATE_EMAIL');
  });

  it('registro publico de administrador retorna 403', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Admin',
      email: 'admin@example.com',
      password: 'secret123',
      role: 'ADMIN',
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ACCESS_DENIED');
  });

  it('faz login versionado com User', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...driverUser,
      passwordHash: await bcrypt.hash('secret123', 4),
    });
    vi.mocked(prisma.refreshSession.create).mockResolvedValue({
      id: 'session-1',
      userId: 'user-driver-1',
      tokenHash: 'hash',
      userAgent: null,
      ipHash: null,
      expiresAt: new Date('2026-01-08T00:00:00.000Z'),
      revokedAt: null,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      replacedById: null,
    });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'driver@example.com',
      password: 'secret123',
    });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toEqual(expect.any(String));
    expect(response.body.user.roles).toEqual(['DRIVER']);
  });

  it('login com senha invalida retorna 401 sem token', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...driverUser,
      passwordHash: await bcrypt.hash('secret123', 4),
    });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'driver@example.com',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    expect(response.body).not.toHaveProperty('accessToken');
  });

  it('/me sem token retorna 401 estruturado', async () => {
    const response = await request(app).get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('motorista autenticado lista apenas suas entregas', async () => {
    await mockSuccessfulLogin();

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'driver@example.com',
      password: 'secret123',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(driverUser);
    vi.mocked(prisma.driverProfile.findUnique).mockResolvedValue(driverProfile);
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([ownedDelivery]);

    const response = await request(app)
      .get('/api/v1/driver/deliveries')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(response.status).toBe(200);
    expect(prisma.delivery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { driverId: 'driver-1' },
      })
    );
    expect(response.body).toHaveLength(1);
  });

  it('motorista sem DriverProfile recebe 403', async () => {
    await mockSuccessfulLogin();

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'driver@example.com',
      password: 'secret123',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(driverUser);
    vi.mocked(prisma.driverProfile.findUnique).mockResolvedValue(null);

    const response = await request(app)
      .get('/api/v1/driver/deliveries')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ACCESS_DENIED');
  });

  it('entrega inexistente retorna 404 para motorista autenticado', async () => {
    await mockSuccessfulLogin();

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'driver@example.com',
      password: 'secret123',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(driverUser);
    vi.mocked(prisma.driverProfile.findUnique).mockResolvedValue(driverProfile);
    vi.mocked(prisma.delivery.findUnique).mockResolvedValue(null);

    const response = await request(app)
      .get('/api/v1/driver/deliveries/missing-delivery')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('motorista A acessa entrega alheia e recebe 403', async () => {
    await mockSuccessfulLogin();

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'driver@example.com',
      password: 'secret123',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(driverUser);
    vi.mocked(prisma.driverProfile.findUnique).mockResolvedValue(driverProfile);
    vi.mocked(prisma.delivery.findUnique).mockResolvedValue({
      ...ownedDelivery,
      id: 'delivery-other',
      driverId: 'driver-2',
    });

    const response = await request(app)
      .get('/api/v1/driver/deliveries/delivery-other')
      .set('Authorization', `Bearer ${login.body.accessToken}`);

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('OWNERSHIP_REQUIRED');
  });

  it('status invalido retorna 422', async () => {
    await mockSuccessfulLogin();

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'driver@example.com',
      password: 'secret123',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(driverUser);
    vi.mocked(prisma.driverProfile.findUnique).mockResolvedValue(driverProfile);
    vi.mocked(prisma.delivery.findUnique).mockResolvedValue(ownedDelivery);

    const response = await request(app)
      .patch('/api/v1/driver/deliveries/delivery-owned/status')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ status: 'BROKEN' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('status valido atualiza entrega propria', async () => {
    await mockSuccessfulLogin();

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'driver@example.com',
      password: 'secret123',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(driverUser);
    vi.mocked(prisma.driverProfile.findUnique).mockResolvedValue(driverProfile);
    vi.mocked(prisma.delivery.findUnique).mockResolvedValue(ownedDelivery);
    vi.mocked(prisma.delivery.update).mockResolvedValue({
      ...ownedDelivery,
      status: 'IN_TRANSIT',
    });

    const response = await request(app)
      .patch('/api/v1/driver/deliveries/delivery-owned/status')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .send({ status: 'IN_TRANSIT' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('IN_TRANSIT');
    expect(prisma.delivery.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'delivery-owned' },
      data: { status: 'IN_TRANSIT' },
    }));
  });
});
