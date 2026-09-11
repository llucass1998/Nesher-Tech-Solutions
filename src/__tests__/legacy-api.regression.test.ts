import bcrypt from 'bcrypt';
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/prisma';
import { routes } from '../routes';
import { Prisma } from '../generated/prisma';

vi.mock('../lib/prisma', () => ({
  prisma: {
    driver: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    vehicle: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    delivery: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(routes);
  return app;
}

describe('regressao da API legada LogiFlow', () => {
  const app = createTestApp();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    process.env.JWT_SECRET = 'legacy-test-secret';
    process.env.PAYMENTS_API_KEY = 'test-payment-api-key';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('registra usuario pela rota legada sem retornar password', async () => {
    vi.mocked(prisma.driver.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.driver.create).mockResolvedValue({
      id: 'driver-1',
      name: 'Motorista',
      email: 'driver@example.com',
      password: await bcrypt.hash('secret123', 4),
      phone: '',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      status: 'AVAILABLE',
    });

    const response = await request(app).post('/users').send({
      name: 'Motorista',
      email: 'driver@example.com',
      password: 'secret123',
    });

    expect(response.status).toBe(410);
    expect(response.body).toMatchObject({ error: 'GONE' });
  });

  it('faz login legado e retorna token', async () => {
    vi.mocked(prisma.driver.findUnique).mockResolvedValue({
      id: 'driver-1',
      name: 'Motorista',
      email: 'driver@example.com',
      password: await bcrypt.hash('secret123', 4),
      phone: '',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      status: 'AVAILABLE',
    });

    const response = await request(app).post('/login').send({
      email: 'driver@example.com',
      password: 'secret123',
    });

    expect(response.status).toBe(410);
    expect(response.body).toMatchObject({ error: 'GONE' });
  });

  it('cria motorista pela rota legada sem retornar password', async () => {
    vi.mocked(prisma.driver.create).mockResolvedValue({
      id: 'driver-2',
      name: 'Novo Motorista',
      email: 'new-driver@example.com',
      password: await bcrypt.hash('secret123', 4),
      phone: '11999999999',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      status: 'AVAILABLE',
    });

    const response = await request(app).post('/drivers').send({
      name: 'Novo Motorista',
      email: 'new-driver@example.com',
      password: 'secret123',
      phone: '11999999999',
    });

    expect(response.status).toBe(410);
    expect(response.body).toMatchObject({ error: 'GONE' });
  });

  it('cria veiculo pela rota legada', async () => {
    vi.mocked(prisma.vehicle.create).mockResolvedValue({
      id: 'vehicle-1',
      model: 'Moto',
      plate: 'ABC1234',
      capacity: 500,
      isActive: true,
      status: 'AVAILABLE',
    });

    const response = await request(app).post('/vehicles').send({
      model: 'Moto',
      plate: 'ABC1234',
      capacity: 500,
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: 'vehicle-1',
      plate: 'ABC1234',
    });
  });

  it('cria entrega operacional sem API key quando nao ha price no payload', async () => {
    vi.mocked(prisma.delivery.create).mockResolvedValue({
      id: 'delivery-1',
      description: 'Entrega',
      pickupAddress: 'Origem',
      deliveryAddress: 'Destino',
      price: new Prisma.Decimal(0),
      status: 'PENDING',
      proofUrl: null,
      driverId: 'driver-1',
      vehicleId: 'vehicle-1',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const response = await request(app).post('/deliveries').send({
      description: 'Entrega',
      pickupAddress: 'Origem',
      deliveryAddress: 'Destino',
      driverId: 'driver-1',
      vehicleId: 'vehicle-1',
    });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: 'delivery-1' });
    expect(response.headers.deprecation).toBe('true');
    expect(response.headers.sunset).toBe('2026-10-31');
    expect(response.headers.link).toBeUndefined();
  });
});
