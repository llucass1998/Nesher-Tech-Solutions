import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

interface AuthenticatedRequest extends Request {
  user?: string | JwtPayload;
}

export const verificarToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token não fornecido.' });
  }

  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ error: 'Token inválido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;

    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' });
  }
};

export const verificarApiKeyPagamento = (req: Request, res: Response, next: NextFunction) => {
  if (!Object.prototype.hasOwnProperty.call(req.body, 'price')) {
    return next();
  }

  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'API key nao fornecida.' });
  }

  if (apiKey !== process.env.PAYMENTS_API_KEY) {
    return res.status(403).json({ error: 'API key invalida.' });
  }

  return next();
};