import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { sendError } from '../lib/api-error';

const allowedDriverStatuses = ['ACCEPTED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED', 'FAILED'];

interface DriverProfileWithDriverId {
  id: string;
  userId: string;
  driverId: string;
  phone: string;
  document: string | null;
  status: string;
  currentVehicleId: string | null;
  operationalData: unknown;
  createdAt: Date;
  updatedAt: Date;
}

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export class DriverV1Controller {
  async me(req: Request, res: Response) {
    const profile = await this.getDriverProfile(req, res);
    if (!profile) return undefined;

    return res.json({ driverProfile: profile });
  }

  async deliveries(req: Request, res: Response) {
    const profile = await this.getDriverProfile(req, res);
    if (!profile) return undefined;

    const deliveries = await prisma.delivery.findMany({
      where: { driverId: profile.driverId },
      include: { driver: true, vehicle: true },
    });

    return res.json(deliveries);
  }

  async delivery(req: Request, res: Response) {
    const profile = await this.getDriverProfile(req, res);
    if (!profile) return undefined;

    const id = getParamValue(req.params.id);
    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { driver: true, vehicle: true },
    });

    if (!delivery) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Entrega nao encontrada.');
    }

    if (delivery.driverId !== profile.driverId) {
      return sendError(res, 403, 'OWNERSHIP_REQUIRED', 'Entrega nao pertence ao motorista autenticado.');
    }

    return res.json(delivery);
  }

  async updateDeliveryStatus(req: Request, res: Response) {
    const profile = await this.getDriverProfile(req, res);
    if (!profile) return undefined;

    const id = getParamValue(req.params.id);
    const { status } = req.body;

    if (!allowedDriverStatuses.includes(status)) {
      return sendError(res, 422, 'INVALID_STATUS_TRANSITION', 'Status invalido para o motorista.');
    }

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: { driver: true, vehicle: true },
    });

    if (!delivery) {
      return sendError(res, 404, 'RESOURCE_NOT_FOUND', 'Entrega nao encontrada.');
    }

    if (delivery.driverId !== profile.driverId) {
      return sendError(res, 403, 'OWNERSHIP_REQUIRED', 'Entrega nao pertence ao motorista autenticado.');
    }

    const updated = await prisma.delivery.update({
      where: { id },
      data: { status },
      include: { driver: true, vehicle: true },
    });

    return res.json(updated);
  }

  private async getDriverProfile(req: Request, res: Response): Promise<DriverProfileWithDriverId | null> {
    const auth = req.auth;
    if (!auth) {
      sendError(res, 401, 'AUTHENTICATION_REQUIRED', 'Autenticacao obrigatoria.');
      return null;
    }

    if (auth.role !== 'DRIVER') {
      sendError(res, 403, 'ACCESS_DENIED', 'Role DRIVER obrigatoria.');
      return null;
    }

    const profile = await prisma.driverProfile.findUnique({
      where: { userId: auth.id },
    });

    if (!profile?.driverId) {
      sendError(res, 403, 'ACCESS_DENIED', 'Motorista sem perfil operacional.');
      return null;
    }

    return {
      ...profile,
      driverId: profile.driverId,
    };
  }
}
