import { BadRequestException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { describe, expect, it, vi } from 'vitest';
import { BenefitsService } from '../src/modules/benefits/benefits.service';

function createBenefitsService() {
  const companyFindUnique = vi.fn().mockResolvedValue({ id: 'company-1' });
  const employeeFindUnique = vi.fn().mockResolvedValue({ id: 'employee-1', companyId: 'company-1' });
  const benefitPlanFindUnique = vi.fn().mockResolvedValue({ id: 'plan-1', companyId: 'company-1', status: 'ACTIVE' });
  const benefitPlanCreate = vi.fn().mockResolvedValue({
    id: 'plan-1',
    companyId: 'company-1',
    type: 'HEALTH',
    status: 'DRAFT',
    legalValidationPending: true,
  });
  const benefitEnrollmentCreate = vi.fn().mockResolvedValue({
    id: 'enrollment-1',
    planId: 'plan-1',
    employeeId: 'employee-1',
    status: 'REQUESTED',
    legalValidationPending: true,
  });

  const prisma = {
    company: {
      findUnique: companyFindUnique,
    },
    employee: {
      findUnique: employeeFindUnique,
    },
    benefitPlan: {
      findMany: vi.fn(),
      findUnique: benefitPlanFindUnique,
      create: benefitPlanCreate,
    },
    benefitEnrollment: {
      findMany: vi.fn(),
      create: benefitEnrollmentCreate,
    },
  };

  const audit = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new BenefitsService(prisma as never, audit as never),
    audit,
    companyFindUnique,
    employeeFindUnique,
    benefitPlanFindUnique,
    benefitPlanCreate,
    benefitEnrollmentCreate,
  };
}

const principal: AuthenticatedPrincipal = {
  userId: 'user-1',
  roles: ['BENEFITS_ANALYST'],
  scopes: [{ type: 'COMPANY', id: 'company-1' }],
};

describe('BenefitsService', () => {
  it('creates a preliminary benefit plan with legal validation pending', async () => {
    const context = createBenefitsService();

    await expect(
      context.service.createPlan(
        {
          companyId: 'company-1',
          name: 'Plano saúde demo',
          providerName: 'Provider demo',
          type: 'HEALTH',
          employerCostAmount: '500.00',
          employeeCostAmount: '120.00',
          currency: 'BRL',
          effectiveFrom: '2026-08-01',
          reason: 'Initial benefits setup',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'plan-1', legalValidationPending: true });

    expect(context.companyFindUnique).toHaveBeenCalledWith({ where: { id: 'company-1' } });
    expect(context.benefitPlanCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          providerName: 'Provider demo',
          type: 'HEALTH',
          recordedBy: 'user-1',
          source: 'logipeople-api',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'benefits.plan.created',
        entityType: 'BenefitPlan',
        entityId: 'plan-1',
      }),
    );
  });

  it('creates a preliminary benefit enrollment without provider integration', async () => {
    const context = createBenefitsService();

    await expect(
      context.service.createEnrollment(
        {
          companyId: 'company-1',
          planId: 'plan-1',
          employeeId: 'employee-1',
          coverageLevel: 'Titular',
          employeeCostAmount: '120.00',
          employerCostAmount: '500.00',
          currency: 'BRL',
          effectiveFrom: '2026-08-01',
          reason: 'Employee benefit enrollment',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'enrollment-1', legalValidationPending: true });

    expect(context.employeeFindUnique).toHaveBeenCalledWith({ where: { id: 'employee-1' } });
    expect(context.benefitEnrollmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          planId: 'plan-1',
          employeeId: 'employee-1',
          coverageLevel: 'Titular',
          recordedBy: 'user-1',
          source: 'logipeople-api',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'benefits.enrollment.created',
        entityType: 'BenefitEnrollment',
        entityId: 'enrollment-1',
      }),
    );
  });

  it('rejects benefit plans with inverted effective dates', async () => {
    const context = createBenefitsService();

    await expect(
      context.service.createPlan({
        companyId: 'company-1',
        name: 'Plano inválido',
        providerName: 'Provider demo',
        type: 'DENTAL',
        effectiveFrom: '2026-09-01',
        effectiveTo: '2026-08-01',
        reason: 'Invalid benefits setup',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects enrollments for inactive plans', async () => {
    const context = createBenefitsService();
    context.benefitPlanFindUnique.mockResolvedValue({ id: 'plan-1', companyId: 'company-1', status: 'INACTIVE' });

    await expect(
      context.service.createEnrollment({
        companyId: 'company-1',
        planId: 'plan-1',
        employeeId: 'employee-1',
        coverageLevel: 'Titular',
        effectiveFrom: '2026-08-01',
        reason: 'Invalid inactive plan enrollment',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
