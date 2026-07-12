export const peopleRoles = [
  'SUPER_ADMIN',
  'PEOPLE_ADMIN',
  'HR_MANAGER',
  'HR_ANALYST',
  'RECRUITER',
  'PAYROLL_MANAGER',
  'PAYROLL_ANALYST',
  'TIME_MANAGER',
  'BENEFITS_ANALYST',
  'MANAGER',
  'EMPLOYEE',
  'AUDITOR',
  'DPO',
] as const;

export type PeopleRole = (typeof peopleRoles)[number];

export const accessScopeTypes = [
  'COMPANY',
  'LEGAL_ENTITY',
  'BRANCH',
  'UNIT',
  'DEPARTMENT',
  'COST_CENTER',
  'TEAM',
  'SUBORDINATES',
  'SELF',
] as const;

export type AccessScopeType = (typeof accessScopeTypes)[number];

export const sensitiveFieldKeys = [
  'salary',
  'bankAccounts',
  'documents',
  'dependents',
  'medicalInformation',
  'biometrics',
  'confidentialEvaluations',
  'disciplinaryMeasures',
] as const;

export type SensitiveFieldKey = (typeof sensitiveFieldKeys)[number];

export interface AccessScope {
  type: AccessScopeType;
  id: string;
}

export interface AuthenticatedPrincipal {
  userId: string;
  employeeId?: string;
  roles: PeopleRole[];
  scopes: AccessScope[];
}

export function hasRole(principal: AuthenticatedPrincipal, allowedRoles: readonly PeopleRole[]): boolean {
  return principal.roles.some((role) => allowedRoles.includes(role));
}

export function isSuperAdmin(principal: AuthenticatedPrincipal): boolean {
  return principal.roles.includes('SUPER_ADMIN');
}
