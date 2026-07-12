const API_URL = process.env.NEXT_PUBLIC_LOGIPEOPLE_API_URL ?? 'http://localhost:3433/api/v1';

export interface PersonSummary {
  id: string;
  fullName: string;
  preferredName?: string | null;
  corporateEmail: string;
  phone?: string | null;
  dataClassification: string;
  employee?: {
    id: string;
    employeeNumber: string;
    status: string;
  } | null;
}

export interface CompanySummary {
  id: string;
  name: string;
  legalName: string;
  registrationNumber: string;
  departments?: unknown[];
  positions?: unknown[];
}

export interface WorkScheduleSummary {
  id: string;
  name: string;
  weeklyMinutes: number;
  workDays: number;
  status: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  company?: { name: string } | null;
  employee?: { employeeNumber: string; person?: { fullName: string; preferredName?: string | null } | null } | null;
}

export interface TimeEntrySummary {
  id: string;
  kind: string;
  occurredAt: string;
  source: string;
  approvalStatus: string;
  employee?: { employeeNumber: string; person?: { fullName: string; preferredName?: string | null } | null } | null;
}

export interface AttendancePeriodSummary {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  plannedMinutes: number;
  workedMinutes: number;
  absenceMinutes: number;
  extraMinutes: number;
  legalValidationPending: boolean;
  company?: { name: string } | null;
  employee?: { employeeNumber: string; person?: { fullName: string; preferredName?: string | null } | null } | null;
}

export async function getPeopleToken(): Promise<string | null> {
  return null;
}

export async function fetchLogiPeople<T>(path: string): Promise<{ data?: T; error?: string; unauthorized?: boolean }> {
  const token = await getPeopleToken();

  if (!token) {
    return { unauthorized: true, error: 'Sem credencial do LogiIdentity nesta sessão.' };
  }

  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    return { error: payload?.error ?? 'Erro ao consultar LogiPeople.' };
  }

  return { data: (await response.json()) as T };
}
