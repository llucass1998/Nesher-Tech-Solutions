'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useRef, useMemo, Suspense } from 'react';
import Image from 'next/image';
import {
  isGlobalAdmin,
  isTechnician,
  isClientUser,
  getPrimaryRoleLabel,
  canAccessRoute,
} from '@/app/lib/auth-rbac';

interface Workspace {
  id: string;
  name: string;
  subtitle: string;
  initials: string;
  badge?: string;
  isGlobal?: boolean;
}

const defaultWorkspaces: Workspace[] = [
  { id: 'global', name: 'Nesher Tech Solutions', subtitle: 'Visão Global (Todas as Empresas)', initials: 'NS', isGlobal: true },
];

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: string;
}

interface NavGroup {
  id: string;
  title: string;
  items: NavItem[];
}

function SidebarNavMenu({
  navGroups,
  openGroups,
  toggleGroup,
  setSidebarOpen,
}: {
  navGroups: NavGroup[];
  openGroups: string[];
  toggleGroup: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isItemActive = (itemHref: string) => {
    const [itemBase, itemQueryString] = itemHref.split('?');

    // Dashboard root route
    if (itemBase === '/dashboard') {
      return pathname === '/dashboard';
    }

    // Must match base pathname exactly or subpaths
    if (pathname !== itemBase && !pathname.startsWith(itemBase + '/')) {
      return false;
    }

    // If this item has query parameters (e.g. ?view=split or ?tab=meus)
    if (itemQueryString) {
      const itemParams = new URLSearchParams(itemQueryString);
      for (const [key, val] of itemParams.entries()) {
        if (searchParams.get(key) !== val) {
          return false;
        }
      }
      return true;
    }

    // If this item has NO query parameters (e.g. /dashboard/chamados):
    // If the current URL has query parameters that belong to another sibling tab/view on the same route,
    // this default item should NOT be highlighted.
    if (itemBase === '/dashboard/chamados') {
      const currentView = searchParams.get('view');
      const currentTab = searchParams.get('tab');
      if (currentView === 'split' || currentTab === 'meus') {
        return false;
      }
      return true;
    }

    return true;
  };

  return (
    <nav className="nesher-nav" aria-label="Navegação do sistema">
      {navGroups.map((group) => {
        const isOpen = openGroups.includes(group.id);
        return (
          <div key={group.id} className="nesher-nav-group">
            <button
              type="button"
              className={'nesher-group-header ' + (isOpen ? 'is-open' : '')}
              onClick={() => toggleGroup(group.id)}
              title={group.title}
            >
              <span>{group.title}</span>
              <i className="ti ti-chevron-down" aria-hidden="true" />
            </button>
            <div className={'nesher-group-items ' + (!isOpen ? 'is-collapsed' : '')}>
              {group.items.map((item) => {
                const active = isItemActive(item.href);
                return (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={'nesher-nav-link ' + (active ? 'is-active' : '')}
                    onClick={() => setSidebarOpen(false)}
                    title={item.label}
                  >
                    <i className={'ti ' + item.icon} aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.badge && (
                      <b
                        style={{
                          background: item.badge.includes('pend') ? '#eab308' : '#246dc0',
                          color: item.badge.includes('pend') ? '#713f12' : '#ffffff',
                        }}
                      >
                        {item.badge}
                      </b>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Security Role Simulation State (for testing & role demonstration)
  const [simulatedRole, setSimulatedRole] = useState<'admin' | 'tech' | 'client' | null>(null);

  // Collapsible Sidebar States (80px collapsed / 280px expanded / hover / pin)
  const [isPinned, setIsPinned] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>(['atendimento']);

  // Dynamic Theme Styling from Settings
  const [customSidebarBg, setCustomSidebarBg] = useState<string | null>(null);

  // Workspace Switcher State
  const [workspaces, setWorkspaces] = useState<Workspace[]>(defaultWorkspaces);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<Workspace>(defaultWorkspaces[0]);
  const [pendingCompaniesCount, setPendingCompaniesCount] = useState(0);
  const [activeTicketsCount, setActiveTicketsCount] = useState(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [companyAvatar, setCompanyAvatar] = useState<{
    type: 'icon' | 'initials' | 'image';
    icon?: string;
    initials?: string;
    imageUrl?: string;
    gradient?: string;
  } | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      // Pinned state from localStorage
      const savedPinned = window.localStorage.getItem('nesher_sidebar_pinned');
      if (savedPinned !== null) {
        setIsPinned(savedPinned === 'true');
      }

      // Simulated role state for testing
      const savedSimRole = window.localStorage.getItem('nesher_simulated_role');
      if (savedSimRole === 'admin' || savedSimRole === 'tech' || savedSimRole === 'client') {
        setSimulatedRole(savedSimRole);
      }

      // Open accordion groups from localStorage
      const savedGroups = window.localStorage.getItem('nesher_sidebar_open_groups');
      if (savedGroups) {
        setOpenGroups(JSON.parse(savedGroups));
      } else {
        // Initial smart default: open group corresponding to active route
        if (pathname.startsWith('/dashboard/chamados') || pathname.startsWith('/dashboard/visitas')) {
          setOpenGroups(['atendimento', 'portal-atendimento']);
        } else if (pathname.startsWith('/dashboard/empresas') || pathname.startsWith('/dashboard/funcionarios') || pathname.startsWith('/dashboard/equipamentos')) {
          setOpenGroups(['clientes', 'portal-empresa']);
        } else if (pathname.startsWith('/dashboard/permissoes') || pathname.startsWith('/dashboard/configuracoes') || pathname.startsWith('/dashboard/tecnicos')) {
          setOpenGroups(['administracao']);
        } else {
          setOpenGroups(['visao-geral']);
        }
      }

      // User session
      const rawUser = window.localStorage.getItem('logiflow_user');
      if (rawUser) {
        setCurrentUser(JSON.parse(rawUser));
      }

      // Custom settings for sidebar background
      const rawSettings = window.localStorage.getItem('nesher_custom_settings');
      if (rawSettings) {
        const parsedSettings = JSON.parse(rawSettings);
        if (parsedSettings.sidebarBg) {
          setCustomSidebarBg(parsedSettings.sidebarBg);
        }
      }

      // Read real companies from localStorage
      const rawCompanies = window.localStorage.getItem('nesher_companies');
      if (rawCompanies) {
        const parsed = JSON.parse(rawCompanies);
        if (Array.isArray(parsed)) {
          const realApproved = parsed.filter(
            (c: any) => c.status === 'Aprovada' && !['comp-1', 'comp-2', 'comp-3', 'comp-4', 'comp-5', 'comp-6'].includes(c.id)
          );
          const pending = parsed.filter(
            (c: any) => c.status === 'Pendente' && !['comp-1', 'comp-2', 'comp-3', 'comp-4', 'comp-5', 'comp-6'].includes(c.id)
          ).length;
          setPendingCompaniesCount(pending);

          const mapped: Workspace[] = realApproved.map((c: any) => ({
            id: c.id,
            name: c.tradeName || c.corporateName,
            subtitle: `${c.slaPlan || 'SLA Padrão'} • ${c.city || 'SP'}`,
            initials: (c.tradeName || 'EM').slice(0, 2).toUpperCase(),
            badge: c.slaPlan?.includes('Ouro') ? 'Ouro' : c.slaPlan?.includes('Prata') ? 'Prata' : 'Básico',
          }));

          setWorkspaces([defaultWorkspaces[0], ...mapped]);
        }
      }

      // Read real tickets count
      const rawTickets = window.localStorage.getItem('nesher_tickets');
      if (rawTickets) {
        const parsedTickets = JSON.parse(rawTickets);
        if (Array.isArray(parsedTickets)) {
          const active = parsedTickets.filter(
            (t: any) => t.status !== 'Fechado' && t.status !== 'Resolvido' && !t.id?.startsWith('NS-20')
          ).length;
          setActiveTicketsCount(active);
        }
      }

      const rawWorkspace = window.localStorage.getItem('nesher_active_workspace');
      if (rawWorkspace) {
        const found = workspaces.find((w) => w.id === rawWorkspace);
        if (found) setActiveWorkspace(found);
      }

      // Load custom company avatar
      const loadAvatar = () => {
        try {
          const rawAvatar = window.localStorage.getItem('nesher_company_avatar');
          if (rawAvatar) {
            setCompanyAvatar(JSON.parse(rawAvatar));
          }
        } catch {}
      };
      loadAvatar();
      window.addEventListener('nesher_avatar_changed', loadAvatar);

      // Load unread notifications
      const loadNotifs = () => {
        try {
          const rawNotifs = window.localStorage.getItem('nesher_notifications');
          if (rawNotifs) {
            const notifs = JSON.parse(rawNotifs);
            if (Array.isArray(notifs)) {
              setUnreadNotificationsCount(notifs.filter((n: any) => !n.read).length);
              return;
            }
          }
          setUnreadNotificationsCount(0);
        } catch {}
      };
      loadNotifs();
      window.addEventListener('nesher_notifications_changed', loadNotifs);

      return () => {
        window.removeEventListener('nesher_avatar_changed', loadAvatar);
        window.removeEventListener('nesher_notifications_changed', loadNotifs);
      };
    } catch {}
  }, []);

  // Ensure active route's group stays open when navigating
  useEffect(() => {
    if (pathname.startsWith('/dashboard/chamados') || pathname.startsWith('/dashboard/visitas')) {
      setOpenGroups((prev) => Array.from(new Set([...prev, 'atendimento', 'portal-atendimento'])));
    } else if (pathname.startsWith('/dashboard/empresas') || pathname.startsWith('/dashboard/funcionarios') || pathname.startsWith('/dashboard/equipamentos')) {
      setOpenGroups((prev) => Array.from(new Set([...prev, 'clientes', 'portal-empresa'])));
    } else if (pathname.startsWith('/dashboard/permissoes') || pathname.startsWith('/dashboard/configuracoes') || pathname.startsWith('/dashboard/tecnicos')) {
      setOpenGroups((prev) => Array.from(new Set([...prev, 'administracao'])));
    } else if (pathname.startsWith('/dashboard/comunicacao') || pathname.startsWith('/dashboard/respostas-rapidas') || pathname.startsWith('/dashboard/notificacoes')) {
      setOpenGroups((prev) => Array.from(new Set([...prev, 'comunicacao', 'portal-comunicacao'])));
    } else if (pathname === '/dashboard' || pathname.startsWith('/dashboard/indicadores')) {
      setOpenGroups((prev) => Array.from(new Set([...prev, 'visao-geral'])));
    }
  }, [pathname]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (workspaceRef.current && !workspaceRef.current.contains(event.target as Node)) {
        setIsWorkspaceMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Active Security Roles
  const activeRoles: string[] = useMemo(() => {
    if (simulatedRole === 'client') return ['CUSTOMER'];
    if (simulatedRole === 'tech') return ['OPERATOR', 'TECH'];
    if (simulatedRole === 'admin') return ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'ADMIN'];
    if (currentUser?.roles && Array.isArray(currentUser.roles) && currentUser.roles.length > 0) {
      return currentUser.roles;
    }
    return ['SUPER_ADMIN', 'GLOBAL_ADMIN', 'ADMIN'];
  }, [simulatedRole, currentUser]);

  const userIsAdmin = isGlobalAdmin(activeRoles);
  const userIsClient = isClientUser(activeRoles);
  const userIsTech = isTechnician(activeRoles) && !userIsAdmin;
  const roleInfo = getPrimaryRoleLabel(activeRoles);

  // Check if current route is authorized for this role
  const hasRouteAccess = canAccessRoute(pathname, activeRoles);

  const handleSelectWorkspace = (ws: Workspace) => {
    setActiveWorkspace(ws);
    setIsWorkspaceMenuOpen(false);
    setSidebarOpen(false);
    try {
      window.localStorage.setItem('nesher_active_workspace', ws.id);
    } catch {}
  };

  const togglePin = () => {
    const nextPinned = !isPinned;
    setIsPinned(nextPinned);
    try {
      window.localStorage.setItem('nesher_sidebar_pinned', String(nextPinned));
    } catch {}
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => {
      const next = prev.includes(groupId) ? prev.filter((g) => g !== groupId) : [...prev, groupId];
      try {
        window.localStorage.setItem('nesher_sidebar_open_groups', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleSimulateRole = (role: 'admin' | 'tech' | 'client') => {
    setSimulatedRole(role);
    try {
      window.localStorage.setItem('nesher_simulated_role', role);
    } catch {}
    setIsProfileMenuOpen(false);
  };

  const displayName = currentUser?.name || (userIsClient ? 'Cliente Conectado' : userIsTech ? 'Técnico de Campo' : 'Administrador Global');
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0].toUpperCase())
    .join('') || (userIsClient ? 'CL' : userIsTech ? 'TC' : 'AD');

  // Breadcrumb Helpers
  const getCategoryName = () => {
    if (userIsClient) return 'Portal do Cliente';
    if (pathname === '/dashboard' || pathname.startsWith('/dashboard/indicadores')) return 'Visão Geral';
    if (pathname.startsWith('/dashboard/chamados') || pathname.startsWith('/dashboard/visitas')) return 'Atendimento';
    if (pathname.startsWith('/dashboard/empresas') || pathname.startsWith('/dashboard/funcionarios') || pathname.startsWith('/dashboard/unidades') || pathname.startsWith('/dashboard/equipamentos')) return 'Clientes & Ativos';
    if (pathname.startsWith('/dashboard/comunicacao') || pathname.startsWith('/dashboard/respostas-rapidas') || pathname.startsWith('/dashboard/notificacoes')) return 'Comunicação';
    if (pathname.startsWith('/dashboard/tecnicos') || pathname.startsWith('/dashboard/permissoes') || pathname.startsWith('/dashboard/configuracoes') || pathname.startsWith('/dashboard/settings')) return 'Administração';
    return 'Sistema';
  };

  const getPageTitle = () => {
    if (pathname === '/dashboard') return userIsClient ? 'Painel da Minha Empresa' : 'Visão Geral';
    if (pathname.startsWith('/dashboard/indicadores')) return 'Indicadores & Métricas';
    if (pathname.startsWith('/dashboard/chamados')) return 'Central de Chamados & OS';
    if (pathname.startsWith('/dashboard/visitas')) return 'Agenda Técnica & Visitas';
    if (pathname.startsWith('/dashboard/empresas')) return 'Empresas Clientes';
    if (pathname.startsWith('/dashboard/funcionarios')) return 'Funcionários & Solicitantes';
    if (pathname.startsWith('/dashboard/unidades')) return 'Unidades & Filiais';
    if (pathname.startsWith('/dashboard/equipamentos')) return 'Inventário de Ativos (CMDB)';
    if (pathname.startsWith('/dashboard/comunicacao')) return 'Central de Conversas';
    if (pathname.startsWith('/dashboard/respostas-rapidas')) return 'Respostas Rápidas';
    if (pathname.startsWith('/dashboard/notificacoes')) return 'Notificações do Sistema';
    if (pathname.startsWith('/dashboard/tecnicos')) return 'Equipe Técnica & Atendentes';
    if (pathname.startsWith('/dashboard/permissoes')) return 'Controle de Acesso & Permissões';
    if (pathname.startsWith('/dashboard/configuracoes') || pathname.startsWith('/dashboard/settings')) return 'Configurações do Sistema';
    if (pathname.startsWith('/dashboard/reports')) return 'Relatórios de Desempenho';
    return 'Painel de Controle';
  };

  // Structured Accordion Navigation Groups filtered strictly by RBAC
  const navGroups: NavGroup[] = useMemo(() => {
    // 1. CLIENT USER: strictly limited to their own tickets, assets, and support
    if (userIsClient) {
      return [
        {
          id: 'portal-atendimento',
          title: 'Atendimento',
          items: [
            {
              href: '/dashboard/chamados',
              label: 'Meus Chamados',
              icon: 'ti-message-circle',
              badge: activeTicketsCount > 0 ? String(activeTicketsCount) : undefined,
            },
          ],
        },
        {
          id: 'portal-empresa',
          title: 'Minha Empresa',
          items: [
            { href: '/dashboard/equipamentos', label: 'Meus Equipamentos', icon: 'ti-devices' },
            { href: '/dashboard/unidades', label: 'Nossas Filiais', icon: 'ti-map-pin' },
          ],
        },
        {
          id: 'portal-comunicacao',
          title: 'Suporte Nesher',
          items: [
            { href: '/dashboard/comunicacao', label: 'Falar com Suporte', icon: 'ti-messages' },
            { href: '/dashboard/notificacoes', label: 'Notificações', icon: 'ti-bell' },
          ],
        },
      ];
    }

    // 2. TECHNICIAN: operational tickets, calendar, assets, chat
    if (userIsTech) {
      return [
        {
          id: 'visao-geral',
          title: 'Visão Geral',
          items: [
            { href: '/dashboard', label: 'Dashboard Operacional', icon: 'ti-layout-dashboard' },
          ],
        },
        {
          id: 'atendimento',
          title: 'Atendimento',
          items: [
            {
              href: '/dashboard/chamados',
              label: 'Central de Chamados',
              icon: 'ti-message-circle',
              badge: activeTicketsCount > 0 ? String(activeTicketsCount) : undefined,
            },
            { href: '/dashboard/visitas', label: 'Agenda Técnica', icon: 'ti-calendar-event' },
          ],
        },
        {
          id: 'clientes',
          title: 'Ativos & Pessoas',
          items: [
            { href: '/dashboard/funcionarios', label: 'Funcionários', icon: 'ti-users-group' },
            { href: '/dashboard/unidades', label: 'Unidades', icon: 'ti-map-pin' },
            { href: '/dashboard/equipamentos', label: 'Equipamentos (CMDB)', icon: 'ti-devices' },
          ],
        },
        {
          id: 'comunicacao',
          title: 'Comunicação',
          items: [
            { href: '/dashboard/comunicacao', label: 'Conversas', icon: 'ti-messages' },
            { href: '/dashboard/respostas-rapidas', label: 'Respostas Rápidas', icon: 'ti-bolt' },
            { href: '/dashboard/notificacoes', label: 'Notificações', icon: 'ti-bell' },
          ],
        },
      ];
    }

    // 3. GLOBAL ADMIN: unrestricted access
    return [
      {
        id: 'visao-geral',
        title: 'Visão Geral',
        items: [
          { href: '/dashboard', label: 'Dashboard', icon: 'ti-layout-dashboard' },
          { href: '/dashboard/indicadores', label: 'Indicadores', icon: 'ti-chart-pie' },
        ],
      },
      {
        id: 'atendimento',
        title: 'Atendimento',
        items: [
          {
            href: '/dashboard/chamados',
            label: 'Central de Chamados',
            icon: 'ti-message-circle',
            badge: activeTicketsCount > 0 ? String(activeTicketsCount) : undefined,
          },
          { href: '/dashboard/visitas', label: 'Agenda Técnica', icon: 'ti-calendar-event' },
        ],
      },
      {
        id: 'clientes',
        title: 'Clientes',
        items: [
          {
            href: '/dashboard/empresas',
            label: 'Empresas',
            icon: 'ti-building-community',
            badge: pendingCompaniesCount > 0 ? `${pendingCompaniesCount} pend.` : undefined,
          },
          { href: '/dashboard/funcionarios', label: 'Funcionários', icon: 'ti-users-group' },
          { href: '/dashboard/unidades', label: 'Unidades', icon: 'ti-map-pin' },
          { href: '/dashboard/equipamentos', label: 'Equipamentos (CMDB)', icon: 'ti-devices' },
        ],
      },
      {
        id: 'comunicacao',
        title: 'Comunicação',
        items: [
          { href: '/dashboard/comunicacao', label: 'Conversas', icon: 'ti-messages' },
          { href: '/dashboard/respostas-rapidas', label: 'Respostas Rápidas', icon: 'ti-bolt' },
          { href: '/dashboard/notificacoes', label: 'Notificações', icon: 'ti-bell' },
        ],
      },
      {
        id: 'administracao',
        title: 'Administração',
        items: [
          { href: '/dashboard/tecnicos', label: 'Atendentes & Técnicos', icon: 'ti-id-badge-2' },
          { href: '/dashboard/permissoes', label: 'Permissões', icon: 'ti-shield-lock' },
          { href: '/dashboard/configuracoes', label: 'Configurações', icon: 'ti-settings' },
        ],
      },
    ];
  }, [userIsClient, userIsTech, activeTicketsCount, pendingCompaniesCount]);

  const isCollapsedMode = !isPinned;

  return (
    <div
      className="nesher-shell"
      style={customSidebarBg ? ({ '--company-sidebar-bg': customSidebarBg } as React.CSSProperties) : undefined}
    >
      <div
        className={'nesher-sidebar-backdrop ' + (isSidebarOpen ? 'is-visible' : '')}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      
      <aside
        className={
          'nesher-sidebar ' +
          (isCollapsedMode ? 'is-collapsed ' : '') +
          (isCollapsedMode && isHovered ? 'is-hovered ' : '') +
          (isSidebarOpen ? 'is-open' : '')
        }
        onMouseEnter={() => {
          if (isCollapsedMode) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (isCollapsedMode) setIsHovered(false);
        }}
      >
        {/* ========================================================= */}
        {/* 1. TOP FIXED ZONE: Brand & Multi-Tenant Workspace Selector */}
        {/* ========================================================= */}
        <div className="nesher-sidebar-top">
          <div className="nesher-sidebar-header">
            <Link href="/dashboard" className="nesher-brand" title="Nesher Tech Solutions">
              <div className="nesher-brand-mark">
                <Image src="/nesher-emblem.png" alt="Nesher Tech Solutions" width={40} height={40} priority />
              </div>
              <div>
                <strong>NESHER</strong>
                <span>TECH SOLUTIONS</span>
              </div>
            </Link>

            {/* Desktop Pin Button */}
            <button
              type="button"
              className={'nesher-pin-btn nesher-desktop-only ' + (isPinned ? 'is-active' : '')}
              onClick={togglePin}
              title={isPinned ? 'Desafixar menu (recolher para 80px)' : 'Fixar menu aberto (280px)'}
              aria-label={isPinned ? 'Desafixar menu lateral' : 'Fixar menu lateral aberto'}
            >
              <i className={'ti ' + (isPinned ? 'ti-pin-filled' : 'ti-pin')} aria-hidden="true" />
            </button>

            {/* Mobile Drawer Close Button */}
            <button
              type="button"
              className="nesher-sidebar-close-btn nesher-mobile-only"
              onClick={() => setSidebarOpen(false)}
              aria-label="Fechar menu lateral"
              title="Fechar menu"
            >
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </div>

          {/* Workspace Switcher: For client, locked to their own company */}
          <div className="nesher-workspace" ref={workspaceRef}>
            <span className="nesher-workspace-label">
              {userIsClient ? 'Sua Organização' : 'Workspace Ativo'}
            </span>
            <div className="nesher-workspace-wrapper">
              <button
                className="nesher-workspace-button"
                type="button"
                onClick={() => {
                  if (!userIsClient) setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen);
                }}
                title={userIsClient ? 'Workspace restrito à sua empresa' : `Workspace: ${activeWorkspace.name} - Clique para alternar`}
                style={userIsClient ? { cursor: 'default' } : undefined}
              >
                <span
                  className="nesher-workspace-avatar"
                  style={{
                    background: companyAvatar?.gradient || (userIsClient ? '#059669' : activeWorkspace.isGlobal ? '#0871d7' : '#a9d4ff'),
                    color: '#ffffff',
                    display: 'grid',
                    placeItems: 'center',
                    overflow: 'hidden',
                  }}
                >
                  {companyAvatar?.type === 'image' && companyAvatar.imageUrl ? (
                    <img
                      src={companyAvatar.imageUrl}
                      alt="Avatar"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : companyAvatar?.type === 'icon' && companyAvatar.icon ? (
                    <i className={`ti ${companyAvatar.icon}`} style={{ fontSize: '16px' }} />
                  ) : (
                    companyAvatar?.initials || (userIsClient ? (currentUser?.companyName ? currentUser.companyName.slice(0, 2).toUpperCase() : 'CL') : activeWorkspace.initials)
                  )}
                </span>
                <span className="nesher-workspace-copy">
                  <strong>{userIsClient ? (currentUser?.companyName || 'Empresa Cliente') : activeWorkspace.name}</strong>
                  <small>{userIsClient ? 'Portal Exclusivo do Cliente' : activeWorkspace.subtitle}</small>
                </span>
                {!userIsClient && (
                  <i className={`ti ti-chevron-${isWorkspaceMenuOpen ? 'up' : 'down'}`} aria-hidden="true" />
                )}
              </button>

              {!userIsClient && isWorkspaceMenuOpen && (
                <div className="nesher-workspace-menu">
                  <div
                    style={{
                      padding: '8px 12px 6px',
                      fontSize: '10px',
                      color: '#8da7c9',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Alternar Organização
                  </div>
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      className={`nesher-workspace-item ${activeWorkspace.id === ws.id ? 'is-selected' : ''}`}
                      onClick={() => handleSelectWorkspace(ws)}
                    >
                      <span
                        className="nesher-workspace-item-icon"
                        style={{ background: ws.isGlobal ? '#176ed1' : '#234473', color: '#fff' }}
                      >
                        {ws.initials}
                      </span>
                      <div className="nesher-workspace-item-info">
                        <strong>{ws.name}</strong>
                        <small>{ws.subtitle}</small>
                      </div>
                      {ws.badge && (
                        <span
                          className={`nesher-sla-badge ${ws.badge.toLowerCase()}`}
                          style={{ fontSize: '9px', padding: '2px 6px' }}
                        >
                          {ws.badge}
                        </span>
                      )}
                    </button>
                  ))}
                  <div className="nesher-workspace-divider" />
                  <Link
                    href="/dashboard/empresas"
                    className="nesher-workspace-item"
                    onClick={() => setIsWorkspaceMenuOpen(false)}
                    style={{ color: '#60a5fa', fontWeight: 700 }}
                  >
                    <i className="ti ti-plus" />
                    <span>Gerenciar Empresas Cadastradas</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MIDDLE SCROLLABLE ZONE: Accordion Navigation Groups     */}
        {/* ========================================================= */}
        <div className="nesher-sidebar-nav-container">
          <Suspense fallback={null}>
            <SidebarNavMenu
              navGroups={navGroups}
              openGroups={openGroups}
              toggleGroup={toggleGroup}
              setSidebarOpen={setSidebarOpen}
            />
          </Suspense>
        </div>

        {/* ========================================================= */}
        {/* 3. BOTTOM FIXED ZONE: NOC Health Status & Logout Button    */}
        {/* ========================================================= */}
        <div className="nesher-sidebar-bottom">
          <div className="nesher-help-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="nesher-help-icon">
                <i className="ti ti-headset" aria-hidden="true" />
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#4ade80',
                  background: 'rgba(74, 222, 128, 0.15)',
                  padding: '2px 6px',
                  borderRadius: '99px',
                }}
              >
                <span className="nesher-pulse-dot" style={{ background: '#4ade80', width: '5px', height: '5px' }} />
                NOC 24/7
              </span>
            </div>
            <strong>{userIsClient ? 'Central de Apoio' : 'Suporte Nesher Tech'}</strong>
            <span>{userIsClient ? 'SLA monitorado pela Nesher.' : 'Plantão e monitoramento contínuo.'}</span>
            <button type="button" onClick={() => (window.location.href = '/dashboard/chamados')}>
              {userIsClient ? 'Ver meus chamados' : 'Abrir chamado rápido'}{' '}
              <i className="ti ti-arrow-up-right" aria-hidden="true" />
            </button>
          </div>

          <Link
            href="/"
            className="nesher-logout"
            title="Sair da conta"
            onClick={() => {
              window.localStorage.removeItem('logiflow_token');
              window.localStorage.removeItem('logiflow_user');
              window.localStorage.removeItem('nesher_simulated_role');
            }}
          >
            <i className="ti ti-logout-2" aria-hidden="true" />
            <span>Sair da conta</span>
          </Link>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* 4. MAIN CONTENT AREA & ENHANCED 64PX TOPBAR               */}
      {/* ========================================================= */}
      <main className={'nesher-main ' + (isCollapsedMode ? 'sidebar-collapsed' : '')}>
        <header className="nesher-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button
              className="nesher-mobile-menu"
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <i className="ti ti-menu-2" aria-hidden="true" />
            </button>

            {/* Clean Breadcrumb */}
            <div className="nesher-breadcrumb">
              <Link
                href="/dashboard"
                style={{ color: '#64748b', display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                title="Página Inicial"
              >
                <i className="ti ti-home" style={{ fontSize: '15px' }} />
              </Link>
              <i className="ti ti-chevron-right" style={{ fontSize: '11px', color: '#cbd5e1' }} />
              <span style={{ color: '#64748b', fontSize: '12px' }}>{getCategoryName()}</span>
              <i className="ti ti-chevron-right" style={{ fontSize: '11px', color: '#cbd5e1' }} />
              <strong style={{ color: '#0f172a', fontSize: '13px' }}>{getPageTitle()}</strong>
            </div>
          </div>

          <div className="nesher-topbar-actions">
            {/* Quick Search trigger */}
            <button
              type="button"
              className="nesher-topbar-search-trigger"
              onClick={() => (window.location.href = '/dashboard/chamados')}
              title="Pesquisa global rápida (Ctrl+K)"
            >
              <i className="ti ti-search" />
              <span>Buscar chamados, ativos, OS...</span>
              <kbd>Ctrl K</kbd>
            </button>

            {/* Security Scope & Role Badge */}
            <span
              className={`nesher-role-badge nesher-role-${roleInfo.badgeClass}`}
              title={roleInfo.description}
            >
              <i
                className={
                  roleInfo.badgeClass === 'admin'
                    ? 'ti ti-shield-lock'
                    : roleInfo.badgeClass === 'tech'
                    ? 'ti ti-tool'
                    : 'ti ti-building-store'
                }
              />
              <span>{roleInfo.label}</span>
            </span>

            {/* Notifications Bell */}
            <Link
              href="/dashboard/notificacoes"
              className="nesher-icon-button nesher-notification"
              aria-label="Notificações"
              title={unreadNotificationsCount > 0 ? `${unreadNotificationsCount} notificações não lidas` : 'Central de Notificações'}
            >
              <i className="ti ti-bell" aria-hidden="true" />
              {unreadNotificationsCount > 0 && <span />}
            </Link>

            <span className="nesher-topbar-divider" />

            {/* Profile Menu with Interactive Role Switcher for Testing */}
            <div style={{ position: 'relative' }} ref={profileRef}>
              <button
                className="nesher-profile-button"
                type="button"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                aria-label="Menu do perfil"
              >
                <span
                  className="nesher-profile-avatar"
                  style={{
                    background: userIsClient ? '#059669' : userIsTech ? '#2563eb' : '#7c3aed',
                    color: '#fff',
                  }}
                >
                  {initials}
                </span>
                <span>
                  <strong>{displayName}</strong>
                  <small>{roleInfo.label}</small>
                </span>
                <i className="ti ti-chevron-down" aria-hidden="true" />
              </button>

              {isProfileMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '260px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '12px',
                    boxShadow: '0 16px 36px rgba(15, 23, 42, 0.16)',
                    padding: '8px',
                    zIndex: 100,
                    animation: 'nesher-toast-in 0.18s ease-out',
                  }}
                >
                  <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{displayName}</strong>
                      <span className={`nesher-role-badge nesher-role-${roleInfo.badgeClass}`} style={{ fontSize: '9.5px', padding: '2px 6px' }}>
                        {roleInfo.label}
                      </span>
                    </div>
                    <small style={{ color: '#64748b', fontSize: '11px' }}>
                      {currentUser?.email || (userIsAdmin ? 'admin@neshertech.com.br' : 'usuario@cliente.com.br')}
                    </small>
                  </div>

                  {/* Security Role Simulator for Testing */}
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px',
                      margin: '4px 0 8px',
                    }}
                  >
                    <span style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                      Simular Nível de Acesso (Teste):
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => handleSimulateRole('admin')}
                        style={{
                          padding: '5px 4px',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: simulatedRole === 'admin' || (!simulatedRole && userIsAdmin) ? '#7c3aed' : '#cbd5e1',
                          background: simulatedRole === 'admin' || (!simulatedRole && userIsAdmin) ? '#ede9fe' : '#ffffff',
                          color: simulatedRole === 'admin' || (!simulatedRole && userIsAdmin) ? '#6d28d9' : '#334155',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Admin
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSimulateRole('tech')}
                        style={{
                          padding: '5px 4px',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: simulatedRole === 'tech' ? '#2563eb' : '#cbd5e1',
                          background: simulatedRole === 'tech' ? '#dbeafe' : '#ffffff',
                          color: simulatedRole === 'tech' ? '#1d4ed8' : '#334155',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Técnico
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSimulateRole('client')}
                        style={{
                          padding: '5px 4px',
                          borderRadius: '6px',
                          border: '1px solid',
                          borderColor: simulatedRole === 'client' ? '#059669' : '#cbd5e1',
                          background: simulatedRole === 'client' ? '#d1fae5' : '#ffffff',
                          color: simulatedRole === 'client' ? '#047857' : '#334155',
                          fontSize: '10px',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Cliente
                      </button>
                    </div>
                  </div>

                  {userIsAdmin && (
                    <>
                      <Link
                        href="/dashboard/configuracoes"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          fontSize: '12px',
                          color: '#334155',
                          textDecoration: 'none',
                          borderRadius: '6px',
                        }}
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <i className="ti ti-settings" />
                        <span>Configurações Globais</span>
                      </Link>

                      <Link
                        href="/dashboard/permissoes"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          fontSize: '12px',
                          color: '#334155',
                          textDecoration: 'none',
                          borderRadius: '6px',
                        }}
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <i className="ti ti-shield-lock" />
                        <span>Permissões &amp; Acesso</span>
                      </Link>

                      <div style={{ height: '1px', background: '#f1f5f9', margin: '4px 0' }} />
                    </>
                  )}

                  <Link
                    href="/"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 10px',
                      fontSize: '12px',
                      color: '#dc2626',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      fontWeight: 600,
                    }}
                    onClick={() => {
                      window.localStorage.removeItem('logiflow_token');
                      window.localStorage.removeItem('logiflow_user');
                      window.localStorage.removeItem('nesher_simulated_role');
                    }}
                  >
                    <i className="ti ti-logout-2" />
                    <span>Sair da conta</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* 5. ACCESS BARRIER OR AUTHORIZED CONTENT                   */}
        {/* ========================================================= */}
        <div className="nesher-content">
          {hasRouteAccess ? (
            children
          ) : (
            <div className="nesher-access-denied-container">
              <div className="nesher-access-denied-card">
                <div className="nesher-access-denied-icon">
                  <i className="ti ti-shield-x" />
                </div>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                    Acesso Restrito ao Administrador Global
                  </h2>
                  <p style={{ fontSize: 13.5, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                    Esta seção corporativa ({getPageTitle()}) é exclusiva para os administradores do NOC da Nesher Tech Solutions.
                    Seu perfil de acesso atual está configurado como <b>{roleInfo.label}</b>.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                  <Link
                    href="/dashboard/chamados"
                    className="nesher-btn-primary"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}
                  >
                    <i className="ti ti-arrow-left" />
                    <span>Voltar para Meus Chamados</span>
                  </Link>
                  {!userIsAdmin && (
                    <button
                      type="button"
                      className="nesher-btn-secondary"
                      onClick={() => handleSimulateRole('admin')}
                    >
                      <i className="ti ti-shield-check" />
                      <span>Alternar para Visão Admin Global</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
