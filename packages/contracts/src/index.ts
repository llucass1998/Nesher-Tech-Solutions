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

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type CreatePositionInput = z.infer<typeof createPositionSchema>;
export type CreatePersonInput = z.infer<typeof createPersonSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
