import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { routes } from '../routes';
import { prisma } from '../lib/prisma';
import { Prisma } from '../generated/prisma';

vi.mock('../lib/prisma', () => ({
  prisma: {
    delivery: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const validPaymentApiKey = 'test-payment-api-key';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(routes);
  return app;
}

const deliveryResponse = {
  id: 'delivery-1',
  description: 'Entrega com cobranca',
  pickupAddress: 'Origem',
  deliveryAddress: 'Destino',
  price: new Prisma.Decimal(42),
  status: 'PENDING',
  proofUrl: null,
  driverId: 'driver-1',
  vehicleId: 'vehicle-1',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  driver: { id: 'driver-1', name: 'Motorista' },
  vehicle: { id: 'vehicle-1', model: 'Moto', plate: 'ABC1234' },
};

describe('API key nos endpoints de pagamento', () => {
  const app = createTestApp();

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PAYMENTS_API_KEY = validPaymentApiKey;

    vi.mocked(prisma.delivery.create).mockResolvedValue(deliveryResponse);
    vi.mocked(prisma.delivery.update).mockResolvedValue(deliveryResponse);
    vi.mocked(prisma.delivery.findMany).mockResolvedValue([deliveryResponse]);
  });

  describe.each([
    {
      method: 'post' as const,
      path: '/deliveries',
      expectedStatus: 201,
      payload: {
        description: 'Entrega com cobranca',
        pickupAddress: 'Origem',
        deliveryAddress: 'Destino',
        price: 42,
        driverId: 'driver-1',
        vehicleId: 'vehicle-1',
      },
    },
    {
      method: 'put' as const,
      path: '/deliveries/delivery-1',
      expectedStatus: 200,
      payload: {
        description: 'Entrega com cobranca atualizada',
        price: 99,
      },
    },
  ])('$method $path com campo price', ({ method, path, expectedStatus, payload }) => {
    it('retorna 401 quando a API key nao e enviada', async () => {
      const response = await request(app)[method](path).send(payload);

      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'API key nao fornecida.' });
    });

    it('retorna 403 quando a API key e invalida', async () => {
      const response = await request(app)
        [method](path)
        .set('x-api-key', 'invalid-payment-api-key')
        .send(payload);

      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'API key invalida.' });
    });

    it('segue o fluxo normal quando a API key e valida', async () => {
      const response = await request(app)
        [method](path)
        .set('x-api-key', validPaymentApiKey)
        .send(payload);

      expect(response.status).toBe(expectedStatus);
      expect(response.body).toMatchObject({ id: 'delivery-1', price: '42' });
    });
  });

  it('mantem consumidores atuais criando entrega sem price e sem API key', async () => {
    const response = await request(app)
      .post('/deliveries')
      .send({
        description: 'Entrega operacional',
        pickupAddress: 'Origem',
        deliveryAddress: 'Destino',
        driverId: 'driver-1',
        vehicleId: 'vehicle-1',
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: 'delivery-1' });
  });

  it('mantem consumidores atuais atualizando entrega sem price e sem API key', async () => {
    const response = await request(app)
      .put('/deliveries/delivery-1')
      .send({
        description: 'Entrega operacional atualizada',
        status: 'IN_TRANSIT',
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: 'delivery-1' });
  });
});
