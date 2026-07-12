import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { hasRole, isSuperAdmin, PeopleRole } from '@logipeople/auth';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { REQUIRED_ROLES_KEY } from './access-control.decorators';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<PeopleRole[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = request.principal;

    if (!principal) {
      throw new ForbiddenException({ error: 'Principal autenticado não encontrado.' });
    }

    if (isSuperAdmin(principal) || hasRole(principal, roles)) {
      return true;
    }

    throw new ForbiddenException({ error: 'Permissão insuficiente.' });
  }
}
