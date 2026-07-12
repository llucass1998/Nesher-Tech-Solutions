import { Request } from 'express';
import { AuthenticatedPrincipal } from '@logipeople/auth';

export interface AuthenticatedRequest extends Request {
  principal?: AuthenticatedPrincipal;
}
