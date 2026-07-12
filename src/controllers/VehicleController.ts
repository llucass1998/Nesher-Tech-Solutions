import { Request, Response } from 'express';
import { Prisma } from '../generated/prisma';
import { prisma } from '../lib/prisma';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export class VehicleController {
  async index(req: Request, res: Response) {
    try {
      const vehicles = await prisma.vehicle.findMany();
      return res.json(vehicles);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar veículos.' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
      });
      if (!vehicle) {
        return res.status(404).json({ error: 'Veículo não encontrado.' });
      }
      return res.json(vehicle);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar veículo.' });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const { model, plate, capacity, status } = req.body;

      if (!model || !plate) {
        return res.status(400).json({ error: 'Campos obrigatórios: model, plate.' });
      }

      const vehicle = await prisma.vehicle.create({
        data: {
          model,
          plate,
          capacity: capacity ? Number(capacity) : 500.0,
          ...(status != null && { status }),
        },
      });

      return res.status(201).json(vehicle);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao cadastrar veículo.' });
    }
  }

  // ==========================================
  // EDITAR VEÍCULO
  // ==========================================
  async update(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);
      const { model, plate, capacity, status } = req.body;

      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: {
          ...(model != null && { model }),
          ...(plate != null && { plate }),
          ...(capacity != null && { capacity: Number(capacity) }),
          ...(status != null && { status }),
        },
      });

      return res.json(vehicle);
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Erro ao atualizar veículo.' });
    }
  }

  // ==========================================
  // EXCLUIR VEÍCULO
  // ==========================================
  async delete(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);

      await prisma.vehicle.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error) {
      console.error(error);
      return res.status(400).json({ error: 'Não foi possível excluir o veículo. Ele pode estar vinculado a uma entrega.' });
    }
  } // <--- Fechamos a função delete aqui!

  // ==========================================
  // ATUALIZAR STATUS DO VEÍCULO (Fora da função delete)
  // ==========================================
  async updateStatus(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);
      const { status } = req.body;

      const vehicle = await prisma.vehicle.update({
        where: { id },
        data: { status },
      });

      return res.json(vehicle);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Veículo não encontrado.' });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar status do veículo.' });
    }
  }
}
