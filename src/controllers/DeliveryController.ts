import { Request, Response } from 'express';
import { Prisma } from '../generated/prisma';
import { prisma } from '../lib/prisma';

const deliveryStatuses = ['PENDING', 'IN_TRANSIT', 'DELIVERED'];

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export class DeliveryController {
  
  // LISTAR TODAS
  async index(req: Request, res: Response) {
    try {
      const deliveries = await prisma.delivery.findMany({
        include: { driver: true, vehicle: true },
      });
      return res.json(deliveries);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar entregas.' });
    }
  }

  // BUSCAR UMA ÚNICA
  async show(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);
      const delivery = await prisma.delivery.findUnique({
        where: { id },
        include: { driver: true, vehicle: true },
      });
      if (!delivery) return res.status(404).json({ error: 'Entrega não encontrada.' });
      return res.json(delivery);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar entrega.' });
    }
  }

  // CRIAR
  async create(req: Request, res: Response) {
    try {
      const {
        description,
        pickupAddress,
        deliveryAddress,
        price,
        driverId,
        vehicleId,
      } = req.body;

      if (!description || !driverId || !vehicleId) {
        return res.status(400).json({ error: 'Campos obrigatorios: description, driverId, vehicleId.' });
      }
      
      const delivery = await prisma.delivery.create({
        data: { 
          description,
          pickupAddress: pickupAddress ?? 'Origem nao informada',
          deliveryAddress: deliveryAddress ?? 'Destino nao informado',
          price: price != null ? Number(price) : 0,
          status: 'PENDING',
          driverId,
          vehicleId,
        },
        include: { driver: true, vehicle: true },
      });
      
      return res.status(201).json(delivery);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar entrega. Verifique os IDs.' });
    }
  }

  // EDITAR (Campos Gerais)
  async update(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);
      const { description, pickupAddress, deliveryAddress, price, status, driverId, vehicleId } = req.body;

      if (status != null && !deliveryStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status invalido.' });
      }

      const delivery = await prisma.delivery.update({
        where: { id },
        data: {
          ...(description != null && { description }),
          ...(pickupAddress != null && { pickupAddress }),
          ...(deliveryAddress != null && { deliveryAddress }),
          ...(price != null && { price: Number(price) }),
          ...(status != null && { status }),
          ...(driverId != null && { driverId }),
          ...(vehicleId != null && { vehicleId }),
        },
        include: { driver: true, vehicle: true },
      });

      return res.json(delivery);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return res.status(404).json({ error: 'Entrega não encontrada.' });
      return res.status(500).json({ error: 'Erro ao atualizar entrega.' });
    }
  }

  // MUDAR STATUS (O que o App do Motorista usa!)
  async updateStatus(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);
      const { status } = req.body;

      // Validação do status
      if (!deliveryStatuses.includes(status)) {
        return res.status(400).json({ error: 'Status invalido.' });
      }

      const delivery = await prisma.delivery.update({
        where: { id },
        data: { status },
        include: { driver: true, vehicle: true },
      });

      return res.json(delivery);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return res.status(404).json({ error: 'Entrega não encontrada.' });
      return res.status(500).json({ error: 'Erro ao atualizar status.' });
    }
  }

  // EXCLUIR
  async delete(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);
      await prisma.delivery.delete({ where: { id } });
      return res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return res.status(404).json({ error: 'Entrega não encontrada.' });
      return res.status(500).json({ error: 'Erro ao deletar entrega.' });
    }
  }
}
