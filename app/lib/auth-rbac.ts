export type UserRole =
  | 'SUPER_ADMIN'
  | 'GLOBAL_ADMIN'
  | 'ADMIN'
  | 'OPERATOR'
  | 'TECH'
  | 'SUPPORT'
  | 'CUSTOMER'
  | 'CLIENT_USER'
  | 'COMPANY_ADMIN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
  companyId?: string;
  companyName?: string;
}

export function isGlobalAdmin(roles?: string[]): boolean {
  if (!roles || !roles.length) return true; // Default to admin if not set
  return roles.some((r) =>
    ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'ADMIN'].includes(r.toUpperCase())
  );
}

export function isTechnician(roles?: string[]): boolean {
  if (!roles || !roles.length) return false;
  return roles.some((r) =>
    ['OPERATOR', 'TECH', 'SUPPORT', 'DRIVER'].includes(r.toUpperCase())
  );
}

export function isClientUser(roles?: string[]): boolean {
  if (!roles || !roles.length) return false;
  return (
    roles.some((r) =>
      ['CUSTOMER', 'CLIENT_USER', 'COMPANY_ADMIN', 'CLIENT'].includes(r.toUpperCase())
    ) && !isGlobalAdmin(roles)
  );
}

export function getPrimaryRoleLabel(roles?: string[]): {
  label: string;
  badgeClass: 'admin' | 'tech' | 'client';
  description: string;
} {
  if (isClientUser(roles)) {
    return {
      label: 'Portal do Cliente',
      badgeClass: 'client',
      description: 'Acesso restrito aos chamados e ativos da sua empresa.',
    };
  }

  if (isTechnician(roles) && !isGlobalAdmin(roles)) {
    return {
      label: 'Técnico Especialista',
      badgeClass: 'tech',
      description: 'Atendimento operacional e execução de ordens de serviço.',
    };
  }

  return {
    label: 'Administrador Global',
    badgeClass: 'admin',
    description: 'Acesso total a todas as empresas, técnicos, configurações e financeiro.',
  };
}

// Routes restricted strictly to Global Admins
export const ADMIN_ONLY_ROUTES = [
  '/dashboard/permissoes',
  '/dashboard/configuracoes',
  '/dashboard/settings',
  '/dashboard/tecnicos',
  '/dashboard/empresas',
  '/dashboard/indicadores',
];

// Routes forbidden for external clients
export const CLIENT_FORBIDDEN_ROUTES = [
  ...ADMIN_ONLY_ROUTES,
  '/dashboard/visitas', // Agenda técnica interna dos analistas
];

export function canAccessRoute(pathname: string, roles?: string[]): boolean {
  const normalized = pathname.toLowerCase();

  // If user is client, block admin and internal routes
  if (isClientUser(roles)) {
    const isForbidden = CLIENT_FORBIDDEN_ROUTES.some((route) =>
      normalized.startsWith(route.toLowerCase())
    );
    return !isForbidden;
  }

  // If user is technician, block permission and config routes
  if (isTechnician(roles) && !isGlobalAdmin(roles)) {
    const isForbidden = [
      '/dashboard/permissoes',
      '/dashboard/configuracoes',
      '/dashboard/settings',
      '/dashboard/tecnicos',
    ].some((route) => normalized.startsWith(route.toLowerCase()));
    return !isForbidden;
  }

  // Global admin can access everything
  return true;
}
