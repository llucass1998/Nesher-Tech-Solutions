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

export interface PayrollCycleSummary {
  id: string;
  name: string;
  referenceMonth: number;
  referenceYear: number;
  periodStart: string;
  periodEnd: string;
  status: string;
  legalValidationPending: boolean;
  company?: { name: string } | null;
  _count?: { runs: number; reopenings: number };
}

export interface PayrollRunSummary {
  id: string;
  status: string;
  grossAmount: string;
  deductionAmount: string;
  netAmount: string;
  currency: string;
  legalValidationPending: boolean;
  cycle?: { name: string; referenceMonth: number; referenceYear: number } | null;
  employee?: { employeeNumber: string; person?: { fullName: string; preferredName?: string | null } | null } | null;
  _count?: { items: number };
}

export interface PayrollItemSummary {
  id: string;
  type: string;
  source: string;
  code: string;
  description: string;
  quantity?: string | null;
  amount: string;
  currency: string;
  taxable: boolean;
  legalValidationPending: boolean;
  run?: { cycle?: { name: string; referenceMonth: number; referenceYear: number } | null } | null;
  employee?: { employeeNumber: string; person?: { fullName: string; preferredName?: string | null } | null } | null;
}

export interface BenefitPlanSummary {
  id: string;
  name: string;
  providerName: string;
  type: string;
  status: string;
  employerCostAmount: string;
  employeeCostAmount: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  legalValidationPending: boolean;
  company?: { name: string } | null;
  _count?: { enrollments: number };
}

export interface BenefitEnrollmentSummary {
  id: string;
  status: string;
  coverageLevel: string;
  employeeCostAmount: string;
  employerCostAmount: string;
  currency: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  legalValidationPending: boolean;
  plan?: { name: string; providerName: string; type: string; company?: { name: string } | null } | null;
  employee?: { employeeNumber: string; person?: { fullName: string; preferredName?: string | null } | null } | null;
}

export interface AbsenceRequestSummary {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  notes?: string | null;
  legalValidationPending: boolean;
  company?: { name: string } | null;
  employee?: { employeeNumber: string; person?: { fullName: string; preferredName?: string | null } | null } | null;
}

export interface VacationPeriodSummary {
  id: string;
  accrualStart: string;
  accrualEnd: string;
  periodStart: string;
  periodEnd: string;
  days: number;
  status: string;
  notes?: string | null;
  legalValidationPending: boolean;
  company?: { name: string } | null;
  employee?: { employeeNumber: string; person?: { fullName: string; preferredName?: string | null } | null } | null;
}

export interface JobOpeningSummary {
  id: string;
  title: string;
  description: string;
  status: string;
  targetOpenings: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  legalValidationPending: boolean;
  company?: { name: string } | null;
  position?: { title: string; status: string } | null;
  _count?: { applications: number };
}

export interface CandidateSummary {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  status: string;
  consentRecordedAt?: string | null;
  dataClassification: string;
  _count?: { applications: number };
}

export interface JobApplicationSummary {
  id: string;
  status: string;
  source: string;
  appliedAt: string;
  notes?: string | null;
  legalValidationPending: boolean;
  opening?: { title: string; company?: { name: string } | null; position?: { title: string } | null } | null;
  candidate?: { fullName: string; email: string } | null;
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
