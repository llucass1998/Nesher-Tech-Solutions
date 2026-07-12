import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AccessScopeType, isSuperAdmin } from '@logipeople/auth';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { REQUIRED_SCOPE_TYPES_KEY } from './access-control.decorators';

interface ScopedRequestBody {
  companyId?: string;
  departmentId?: string;
  costCenterId?: string;
  teamId?: string;
}

@Injectable()
export class AbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredScopeTypes = this.reflector.getAllAndOverride<AccessScopeType[]>(REQUIRED_SCOPE_TYPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredScopeTypes || requiredScopeTypes.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const principal = request.principal;

    if (!principal) {
      throw new ForbiddenException({ error: 'Principal autenticado não encontrado.' });
    }

    if (isSuperAdmin(principal)) {
      return true;
    }

    const body = request.body as ScopedRequestBody | undefined;
    const scopeId = body?.companyId ?? body?.departmentId ?? body?.costCenterId ?? body?.teamId ?? request.params.id;

    const hasScope = principal.scopes.some((scope) => {
      if (!requiredScopeTypes.includes(scope.type)) {
        return false;
      }

      if (scope.type === 'SELF') {
        return principal.employeeId != null && principal.employeeId === request.params.id;
      }

      return scopeId == null || scope.id === scopeId;
    });

    if (hasScope) {
      return true;
    }

    throw new ForbiddenException({ error: 'Escopo de acesso insuficiente.' });
  }
}
