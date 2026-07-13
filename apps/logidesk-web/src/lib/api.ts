const API_URL = process.env.NEXT_PUBLIC_LOGIDESK_API_URL ?? 'http://localhost:3533/api/v1';

export interface TicketSummary {
  id: string;
  number: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  source: string;
  requesterEmail?: string | null;
  assigneeId?: string | null;
  teamId?: string | null;
  deliveryId?: string | null;
  occurrenceId?: string | null;
  correlationId: string;
  createdAt: string;
  updatedAt: string;
  sla?: {
    status: string;
    firstResponseDueAt: string;
    resolutionDueAt: string;
  } | null;
  _count?: {
    messages: number;
    notes: number;
  };
}

export async function fetchLogiDesk<T>(path: string): Promise<{ data?: T; error?: string }> {
  try {
    const response = await fetch(`${API_URL}${path}`, { cache: 'no-store' });

    if (!response.ok) {
      return { error: `LogiDesk API respondeu ${response.status}.` };
    }

    return { data: (await response.json()) as T };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Falha ao conectar no LogiDesk API.' };
  }
}
