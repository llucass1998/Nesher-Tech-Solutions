import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { Prisma } from '../generated/prisma';
import { prisma } from '../lib/prisma';

function getParamValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export class DriverController {
  
  async index(req: Request, res: Response) {
    try {
      const drivers = await prisma.driver.findMany();
      return res.json(drivers);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar motociclistas.' });
    }
  }

  async show(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);
      const driver = await prisma.driver.findUnique({
        where: { id },
      });
      if (!driver) {
        return res.status(404).json({ error: 'Motociclista não encontrado.' });
      }
      return res.json(driver);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar motociclista.' });
    }
  }

  // ==========================================
  // CRIAR NOVO MOTORISTA
  // ==========================================
  async create(req: Request, res: Response) {
    try {
      const { name, email, password, phone, status } = req.body;
      
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Campos obrigatórios: name, email, password.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const driver = await prisma.driver.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: phone ?? '',
          ...(status != null && { status }),
        },
      });

      const { password: _, ...driverWithoutPassword } = driver;
      
      return res.status(201).json(driverWithoutPassword);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao cadastrar motociclista.' });
    }
  }

  // ==========================================
  // EDITAR MOTORISTA
  // ==========================================
  async update(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);
      const { name, email, phone, status } = req.body;

      const driver = await prisma.driver.update({
        where: { id },
        data: { 
          ...(name != null && { name }),
          ...(email != null && { email }),
          ...(phone != null && { phone }),
          ...(status != null && { status }),
        },
      });

      return res.json(driver);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Motociclista não encontrado.' });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar motociclista.' });
    }
  }

  // ==========================================
  // ATUALIZAR STATUS DO MOTORISTA
  // ==========================================
  async updateStatus(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);
      const { status } = req.body;

      const driver = await prisma.driver.update({
        where: { id },
        data: { status },
      });

      return res.json(driver);
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Motociclista não encontrado.' });
      }
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar status do motociclista.' });
    }
  }

  // ==========================================
  // EXCLUIR MOTORISTA
  // ==========================================
  async delete(req: Request, res: Response) {
    try {
      const id = getParamValue(req.params.id);

      await prisma.driver.delete({
        where: { id },
      });

      return res.status(204).send();
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        return res.status(404).json({ error: 'Motociclista não encontrado.' });
      }
      console.error(error);
      return res.status(400).json({ error: 'Erro ao deletar motociclista. Ele pode estar vinculado a uma entrega.' });
    }
  }
} // <--- Esta chave final fecha a classe DriverController
