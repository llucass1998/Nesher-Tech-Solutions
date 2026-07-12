import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcrypt';

export class UserController {
  async create(req: Request, res: Response) {
    try {
      const { name, email, password } = req.body;

      // 1. Verifica se o e-mail já existe no banco
      const driverExists = await prisma.driver.findUnique({
        where: { email },
      });

      if (driverExists) {
        return res.status(400).json({ error: 'Este e-mail já está em uso.' });
      }

      // 2. Criptografa a senha antes de salvar
      const hashedPassword = await bcrypt.hash(password, 10);

      // 3. Salva no banco de dados
      const driver = await prisma.driver.create({
        data: {
          name,
          email,
          password: hashedPassword,
          phone: '',
        },
      });

      // 4. Remove a senha do objeto de resposta por segurança
      const { password: _, ...driverWithoutPassword } = driver;

      return res.status(201).json(driverWithoutPassword);
      
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      return res.status(500).json({ error: 'Erro interno ao criar conta.' });
    }
  }
}