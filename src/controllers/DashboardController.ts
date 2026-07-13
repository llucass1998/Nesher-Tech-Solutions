import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

const chartWindowDays = 7;

function toDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function toDayLabel(date: Date) {
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

function getChartWindow() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(today.getDate() - (chartWindowDays - 1));

  const days = Array.from({ length: chartWindowDays }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      key: toDayKey(date),
      name: toDayLabel(date),
      entregas: 0,
    };
  });

  return { start, days };
}

export class DashboardController {
  async metrics(_req: Request, res: Response) {
    try {
      const { start, days } = getChartWindow();

      const [
        totalVehicles,
        activeDrivers,
        vehiclesInRoute,
        deliveredDeliveries,
        recentDeliveredDeliveries,
      ] = await Promise.all([
        prisma.vehicle.count(),
        prisma.driver.count({ where: { status: 'AVAILABLE' } }),
        prisma.delivery.findMany({
          where: { status: 'IN_TRANSIT' },
          distinct: ['vehicleId'],
          select: { vehicleId: true },
        }),
        prisma.delivery.count({ where: { status: 'DELIVERED' } }),
        prisma.delivery.findMany({
          where: {
            status: 'DELIVERED',
            updatedAt: { gte: start },
          },
          select: { updatedAt: true },
        }),
      ]);

      const deliveriesByDay = new Map(days.map((day) => [day.key, day.entregas]));

      recentDeliveredDeliveries.forEach((delivery) => {
        const key = toDayKey(delivery.updatedAt);
        deliveriesByDay.set(key, (deliveriesByDay.get(key) ?? 0) + 1);
      });

      const chartData = days.map((day) => ({
        name: day.name,
        entregas: deliveriesByDay.get(day.key) ?? 0,
      }));

      return res.json({
        totalVehicles,
        activeDrivers,
        vehiclesInRoute: vehiclesInRoute.length,
        deliveredDeliveries,
        chartData,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao carregar metricas do dashboard.' });
    }
  }
}
