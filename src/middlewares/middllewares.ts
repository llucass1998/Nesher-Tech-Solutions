import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { sendError } from '../lib/api-error';
import { verifyAccessToken } from '../lib/auth-tokens';

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

type DeprecatedRouteOptions = {
  successor?: string;
  sunset?: string;
};

const defaultLegacySunset = process.env.LEGACY_API_SUNSET ?? '2026-10-31';

export const deprecatedRoute = ({ successor, sunset = defaultLegacySunset }: DeprecatedRouteOptions = {}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Deprecation', 'true');
    res.setHeader('Sunset', sunset);

    if (successor) {
      res.setHeader('Link', `<${successor}>; rel="successor-version"`);
    }

    console.warn(JSON.stringify({
      level: 'warn',
      event: 'legacy_route_used',
      method: req.method,
      path: req.originalUrl || req.path,
      successor,
      sunset,
    }));

    return next();
  };
};

export const verificarAccessTokenV1 = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return sendError(res, 401, 'AUTHENTICATION_REQUIRED', 'Token nao fornecido.');
  }

  const token = authHeader.slice('Bearer '.length);

  try {
    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: decoded.sub } });

    if (!user || user.status !== 'ACTIVE') {
      return sendError(res, 401, 'TOKEN_EXPIRED', 'Usuario inativo ou inexistente.');
    }

    req.auth = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    return next();
  } catch {
    return sendError(res, 401, 'TOKEN_EXPIRED', 'Token invalido ou expirado.');
  }
};
