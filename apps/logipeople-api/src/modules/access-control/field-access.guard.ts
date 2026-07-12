import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isSuperAdmin, SensitiveFieldKey } from '@logipeople/auth';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { SENSITIVE_FIELDS_KEY } from './access-control.decorators';

const fieldRoleAccess: Record<SensitiveFieldKey, string[]> = {
  salary: ['PEOPLE_ADMIN', 'PAYROLL_MANAGER', 'PAYROLL_ANALYST', 'AUDITOR'],
  bankAccounts: ['PEOPLE_ADMIN', 'PAYROLL_MANAGER', 'PAYROLL_ANALYST'],
  documents: ['PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'DPO'],
  dependents: ['PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'BENEFITS_ANALYST'],
  medicalInformation: ['DPO'],
  biometrics: ['DPO'],
  confidentialEvaluations: ['PEOPLE_ADMIN', 'HR_MANAGER'],
  disciplinaryMeasures: ['PEOPLE_ADMIN', 'HR_MANAGER'],
};

@Injectable()
export class FieldAccessGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const sensitiveFields = this.reflector.getAllAndOverride<SensitiveFieldKey[]>(SENSITIVE_FIELDS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!sensitiveFields || sensitiveFields.length === 0) {
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

    const canAccessAll = sensitiveFields.every((field) => {
      const allowedRoles = fieldRoleAccess[field];
      return principal.roles.some((role) => allowedRoles.includes(role));
    });

    if (canAccessAll) {
      return true;
    }

    throw new ForbiddenException({ error: 'Permissão de campo sensível insuficiente.' });
  }
}
