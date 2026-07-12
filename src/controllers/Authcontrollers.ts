import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      }

      const driver = await prisma.driver.findUnique({ where: { email } });

      if (!driver) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      const passwordMatch = await bcrypt.compare(password, driver.password);

      if (!passwordMatch) {
        return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
      }

      const token = jwt.sign(
        { id: driver.id },
        process.env.JWT_SECRET as string,
        { expiresIn: '8h' }
      );

      res.status(200).json({
        message: 'Login realizado com sucesso.',
        token,
        driver: { id: driver.id, name: driver.name, email: driver.email },
      });
    } catch (error) {
      console.error('Erro login:', error);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  }
}