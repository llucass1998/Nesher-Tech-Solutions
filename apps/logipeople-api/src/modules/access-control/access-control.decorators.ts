import { SetMetadata } from '@nestjs/common';
import { AccessScopeType, PeopleRole, SensitiveFieldKey } from '@logipeople/auth';

export const REQUIRED_ROLES_KEY = 'requiredRoles';
export const REQUIRED_SCOPE_TYPES_KEY = 'requiredScopeTypes';
export const SENSITIVE_FIELDS_KEY = 'sensitiveFields';

export function Roles(...roles: PeopleRole[]) {
  return SetMetadata(REQUIRED_ROLES_KEY, roles);
}

export function ScopeTypes(...scopeTypes: AccessScopeType[]) {
  return SetMetadata(REQUIRED_SCOPE_TYPES_KEY, scopeTypes);
}

export function SensitiveFields(...fields: SensitiveFieldKey[]) {
  return SetMetadata(SENSITIVE_FIELDS_KEY, fields);
}
