const API_URL = process.env.NEXT_PUBLIC_LOGIDESK_API_URL ?? 'http://localhost:3533/api/v1';

export interface SupportCatalogItem {
  id: string;
  name: string;
  description?: string | null;
  color?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TicketSummary {
  id: string;
  number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  source: string;
  requesterName?: string | null;
  requesterEmail?: string | null;
  assigneeId?: string | null;
  teamId?: string | null;
  categoryId?: string | null;
  category?: string | null;
  deliveryId?: string | null;
  occurrenceId?: string | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  team?: SupportCatalogItem | null;
  categoryRecord?: SupportCatalogItem | null;
  tagAssignments?: Array<{ tag: SupportCatalogItem }>;
  messages?: Array<{ id: string; authorRole: string; body: string; createdAt: string }>;
  notes?: Array<{ id: string; authorId?: string | null; body: string; createdAt: string; editedAt?: string | null }>;
  assignments?: Array<{ id: string; assigneeId?: string | null; assignedById?: string | null; teamId?: string | null; reason?: string | null; createdAt: string }>;
  history?: Array<{ id: string; action: string; previousStatus?: string | null; newStatus?: string | null; reason?: string | null; createdAt: string }>;
  sla?: {
    status: string;
    firstResponseDueAt: string;
    resolutionDueAt: string;
  } | null;
  _count?: {
    messages: number;
    notes: number;
    assignments?: number;
  };
}

export interface CountGroup {
  value: string;
  count: number;
}

export interface SupportReportSummary {
  totals: {
    tickets: number;
    activeTickets: number;
    unassignedTickets: number;
    unreadNotifications: number;
  };
  ticketsByStatus: CountGroup[];
  ticketsByPriority: CountGroup[];
  ticketsBySource: CountGroup[];
  slaByStatus: CountGroup[];
}

export interface SupportNotification {
  id: string;
  ticketId?: string | null;
  userId?: string | null;
  teamId?: string | null;
  type: string;
  title: string;
  body: string;
  readAt?: string | null;
  correlationId: string;
  createdAt: string;
  ticket?: {
    id: string;
    number: string;
    subject: string;
    status: string;
    priority: string;
  } | null;
}

export interface SupportNotificationPreference {
  id: string;
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  assignmentEnabled: boolean;
  slaEnabled: boolean;
  messageEnabled: boolean;
  updatedById?: string | null;
  correlationId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type LogiDeskResult<T> = Promise<{ data?: T; error?: string }>;

export async function fetchLogiDesk<T>(path: string): LogiDeskResult<T> {
  return requestLogiDesk<T>(path, { method: 'GET', cache: 'no-store' });
}

export async function mutateLogiDesk<T>(path: string, method: 'POST' | 'PATCH' | 'DELETE', body: Record<string, unknown>): LogiDeskResult<T> {
  return requestLogiDesk<T>(path, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
}

async function requestLogiDesk<T>(path: string, init: RequestInit): LogiDeskResult<T> {
  try {
    const response = await fetch(`${API_URL}${path}`, init);

    if (!response.ok) {
      return { error: `LogiDesk API respondeu ${response.status}.` };
    }

    return { data: (await response.json()) as T };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Falha ao conectar no LogiDesk API.' };
  }
}

export function newCorrelationId() {
  return crypto.randomUUID();
}
