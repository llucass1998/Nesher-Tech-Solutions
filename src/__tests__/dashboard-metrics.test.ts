import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/prisma';
import { routes } from '../routes';
import { Prisma } from '../generated/prisma';

vi.mock('../lib/prisma', () => ({
  prisma: {
    vehicle: {
      count: vi.fn(),
    },
    driver: {
      count: vi.fn(),
    },
    delivery: {
      count: vi.fn(),
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

function makeDelivery(overrides: Partial<{
  id: string;
  status: string;
  vehicleId: string;
  updatedAt: Date;
}> = {}) {
  return {
    id: overrides.id ?? 'delivery-1',
    description: 'Entrega',
    pickupAddress: 'Origem',
    deliveryAddress: 'Destino',
    price: new Prisma.Decimal(0),
    status: overrides.status ?? 'DELIVERED',
    proofUrl: null,
    driverId: 'driver-1',
    vehicleId: overrides.vehicleId ?? 'vehicle-1',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

describe('metricas operacionais do dashboard', () => {
  const app = createTestApp();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.mocked(prisma.vehicle.count).mockResolvedValue(4);
    vi.mocked(prisma.driver.count).mockResolvedValue(3);
    vi.mocked(prisma.delivery.count).mockResolvedValue(8);
    vi.mocked(prisma.delivery.findMany)
      .mockResolvedValueOnce([
        makeDelivery({ id: 'in-route-1', status: 'IN_TRANSIT', vehicleId: 'vehicle-1' }),
        makeDelivery({ id: 'in-route-2', status: 'IN_TRANSIT', vehicleId: 'vehicle-2' }),
      ])
      .mockResolvedValueOnce([
        makeDelivery({ id: 'delivered-1', updatedAt: new Date() }),
        makeDelivery({ id: 'delivered-2', updatedAt: new Date() }),
      ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('retorna metricas agregadas na rota versionada', async () => {
    const response = await request(app).get('/api/v1/dashboard/metrics');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      totalVehicles: 4,
      activeDrivers: 3,
      vehiclesInRoute: 2,
      deliveredDeliveries: 8,
    });
    expect(response.body.chartData).toHaveLength(7);
    expect(response.body.chartData.at(-1)).toMatchObject({ entregas: 2 });
    expect(prisma.driver.count).toHaveBeenCalledWith({ where: { status: 'AVAILABLE' } });
    expect(prisma.delivery.count).toHaveBeenCalledWith({ where: { status: 'DELIVERED' } });
  });

  it('mantem alias legado depreciado para consumidores atuais', async () => {
    const response = await request(app).get('/dashboard/metrics');

    expect(response.status).toBe(200);
    expect(response.headers.deprecation).toBe('true');
    expect(response.headers.link).toBe('</api/v1/dashboard/metrics>; rel="successor-version"');
    expect(response.body.totalVehicles).toBe(4);
  });
});
