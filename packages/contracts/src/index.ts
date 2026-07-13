import { z } from 'zod';

export const dataClassificationSchema = z.enum([
  'PUBLIC',
  'INTERNAL',
  'CONFIDENTIAL',
  'SENSITIVE',
  'RESTRICTED',
]);

export const roleSchema = z.enum([
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
]);

export const accessScopeSchema = z.object({
  type: z.enum([
    'COMPANY',
    'LEGAL_ENTITY',
    'BRANCH',
    'UNIT',
    'DEPARTMENT',
    'COST_CENTER',
    'TEAM',
    'SUBORDINATES',
    'SELF',
  ]),
  id: z.string().min(1),
});

export const createCompanySchema = z.object({
  name: z.string().min(2),
  legalName: z.string().min(2),
  registrationNumber: z.string().min(3),
});

export const createDepartmentSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2),
  code: z.string().min(2),
});

export const createPositionSchema = z.object({
  companyId: z.string().uuid(),
  departmentId: z.string().uuid(),
  title: z.string().min(2),
  status: z.enum(['OCCUPIED', 'VACANT', 'FROZEN', 'PLANNED', 'CLOSED']).default('VACANT'),
});

export const createPersonSchema = z.object({
  fullName: z.string().min(2),
  preferredName: z.string().optional(),
  corporateEmail: z.string().email(),
  personalEmail: z.string().email().optional(),
  phone: z.string().optional(),
  dataClassification: dataClassificationSchema.default('CONFIDENTIAL'),
});

export const createEmployeeSchema = z.object({
  personId: z.string().uuid(),
  companyId: z.string().uuid(),
  positionId: z.string().uuid().optional(),
  employeeNumber: z.string().min(1),
  hireDate: z.string().date(),
});

export const createWorkScheduleSchema = z.object({
  companyId: z.string().uuid(),
  employeeId: z.string().uuid().optional(),
  name: z.string().min(2),
  weeklyMinutes: z.number().int().positive(),
  workDays: z.number().int().min(1).max(7),
  effectiveFrom: z.string().date(),
  effectiveTo: z.string().date().optional(),
  reason: z.string().min(3),
});

export const createTimeEntrySchema = z.object({
  employeeId: z.string().uuid(),
  kind: z.enum(['CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END', 'ADJUSTMENT']),
  occurredAt: z.string().datetime(),
  source: z.enum(['MANUAL', 'IMPORTED', 'MOBILE', 'WEB', 'API']).default('MANUAL'),
  notes: z.string().optional(),
  reason: z.string().min(3),
});

export const createAttendancePeriodSchema = z.object({
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  plannedMinutes: z.number().int().min(0).default(0),
  workedMinutes: z.number().int().min(0).default(0),
  absenceMinutes: z.number().int().min(0).default(0),
  extraMinutes: z.number().int().min(0).default(0),
  reason: z.string().min(3),
});

export const createPayrollCycleSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2),
  referenceMonth: z.number().int().min(1).max(12),
  referenceYear: z.number().int().min(2000).max(2100),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  reason: z.string().min(3),
});

export const createPayrollRunSchema = z.object({
  cycleId: z.string().uuid(),
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  grossAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
  deductionAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
  netAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
  currency: z.string().length(3).default('BRL'),
  reason: z.string().min(3),
});

export const createPayrollItemSchema = z.object({
  runId: z.string().uuid(),
  employeeId: z.string().uuid(),
  type: z.enum(['EARNING', 'DEDUCTION', 'EMPLOYER_CHARGE', 'INFORMATIONAL']),
  source: z.enum(['MANUAL', 'IMPORTED', 'ATTENDANCE', 'BENEFITS', 'CONTRACT', 'ADJUSTMENT']).default('MANUAL'),
  code: z.string().min(1),
  description: z.string().min(2),
  quantity: z.string().regex(/^\d+(\.\d{1,4})?$/).optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
  currency: z.string().length(3).default('BRL'),
  taxable: z.boolean().default(false),
  reason: z.string().min(3),
});

export const requestPayrollReopeningSchema = z.object({
  cycleId: z.string().uuid(),
  reason: z.string().min(10),
});

export const createBenefitPlanSchema = z.object({
  companyId: z.string().uuid(),
  name: z.string().min(2),
  providerName: z.string().min(2),
  type: z.enum(['HEALTH', 'DENTAL', 'MEAL', 'FOOD', 'TRANSPORT', 'LIFE_INSURANCE', 'WELLNESS', 'OTHER']),
  employerCostAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
  employeeCostAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
  currency: z.string().length(3).default('BRL'),
  effectiveFrom: z.string().date(),
  effectiveTo: z.string().date().optional(),
  reason: z.string().min(3),
});

export const createBenefitEnrollmentSchema = z.object({
  companyId: z.string().uuid(),
  planId: z.string().uuid(),
  employeeId: z.string().uuid(),
  coverageLevel: z.string().min(2),
  employeeCostAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
  employerCostAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).default('0'),
  currency: z.string().length(3).default('BRL'),
  effectiveFrom: z.string().date(),
  effectiveTo: z.string().date().optional(),
  reason: z.string().min(3),
});

export const createAbsenceRequestSchema = z.object({
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  type: z.enum(['SICK_LEAVE', 'PERSONAL_LEAVE', 'UNPAID_LEAVE', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'OTHER']),
  startDate: z.string().date(),
  endDate: z.string().date(),
  totalDays: z.number().int().min(1),
  notes: z.string().optional(),
  reason: z.string().min(3),
});

export const createVacationPeriodSchema = z.object({
  companyId: z.string().uuid(),
  employeeId: z.string().uuid(),
  accrualStart: z.string().date(),
  accrualEnd: z.string().date(),
  periodStart: z.string().date(),
  periodEnd: z.string().date(),
  days: z.number().int().min(1),
  notes: z.string().optional(),
  reason: z.string().min(3),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreatePositionInput = z.infer<typeof createPositionSchema>;
export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type CreateWorkScheduleInput = z.infer<typeof createWorkScheduleSchema>;
export type CreateTimeEntryInput = z.infer<typeof createTimeEntrySchema>;
export type CreateAttendancePeriodInput = z.infer<typeof createAttendancePeriodSchema>;
export type CreatePayrollCycleInput = z.infer<typeof createPayrollCycleSchema>;
export type CreatePayrollRunInput = z.infer<typeof createPayrollRunSchema>;
export type CreatePayrollItemInput = z.infer<typeof createPayrollItemSchema>;
export type RequestPayrollReopeningInput = z.infer<typeof requestPayrollReopeningSchema>;
export type CreateBenefitPlanInput = z.infer<typeof createBenefitPlanSchema>;
export type CreateBenefitEnrollmentInput = z.infer<typeof createBenefitEnrollmentSchema>;
export type CreateAbsenceRequestInput = z.infer<typeof createAbsenceRequestSchema>;
export type CreateVacationPeriodInput = z.infer<typeof createVacationPeriodSchema>;
