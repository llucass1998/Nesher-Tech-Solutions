import { BadRequestException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { describe, expect, it, vi } from 'vitest';
import { OnboardingService } from '../src/modules/onboarding/onboarding.service';

function createOnboardingService() {
  const companyFindUnique = vi.fn().mockResolvedValue({ id: 'company-1' });
  const employeeFindUnique = vi.fn().mockResolvedValue({ id: 'employee-1', companyId: 'company-1' });
  const onboardingPlanFindUnique = vi.fn().mockResolvedValue({ id: 'plan-1', companyId: 'company-1', employeeId: 'employee-1', status: 'ACTIVE' });
  const onboardingPlanCreate = vi.fn().mockResolvedValue({
    id: 'plan-1',
    companyId: 'company-1',
    employeeId: 'employee-1',
    status: 'DRAFT',
    legalValidationPending: true,
  });
  const onboardingTaskCreate = vi.fn().mockResolvedValue({
    id: 'task-1',
    planId: 'plan-1',
    employeeId: 'employee-1',
    owner: 'HR',
    status: 'PENDING',
    legalValidationPending: true,
  });

  const prisma = {
    company: {
      findUnique: companyFindUnique,
    },
    employee: {
      findUnique: employeeFindUnique,
    },
    onboardingPlan: {
      findMany: vi.fn(),
      findUnique: onboardingPlanFindUnique,
      create: onboardingPlanCreate,
    },
    onboardingTask: {
      findMany: vi.fn(),
      create: onboardingTaskCreate,
    },
  };

  const audit = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new OnboardingService(prisma as never, audit as never),
    audit,
    companyFindUnique,
    employeeFindUnique,
    onboardingPlanFindUnique,
    onboardingPlanCreate,
    onboardingTaskCreate,
  };
}

const principal: AuthenticatedPrincipal = {
  userId: 'user-1',
  roles: ['HR_ANALYST'],
  scopes: [{ type: 'COMPANY', id: 'company-1' }],
};

describe('OnboardingService', () => {
  it('creates a preliminary onboarding plan with legal validation pending', async () => {
    const context = createOnboardingService();

    await expect(
      context.service.createPlan(
        {
          companyId: 'company-1',
          employeeId: 'employee-1',
          name: 'Onboarding administrativo',
          startDate: '2026-08-01',
          targetEndDate: '2026-08-15',
          reason: 'Initial onboarding setup',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'plan-1', legalValidationPending: true });

    expect(context.companyFindUnique).toHaveBeenCalledWith({ where: { id: 'company-1' } });
    expect(context.employeeFindUnique).toHaveBeenCalledWith({ where: { id: 'employee-1' } });
    expect(context.onboardingPlanCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          employeeId: 'employee-1',
          name: 'Onboarding administrativo',
          recordedBy: 'user-1',
          source: 'logipeople-api',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'onboarding.plan.created',
        entityType: 'OnboardingPlan',
        entityId: 'plan-1',
      }),
    );
  });

  it('creates a preliminary onboarding task without external provisioning', async () => {
    const context = createOnboardingService();

    await expect(
      context.service.createTask(
        {
          planId: 'plan-1',
          employeeId: 'employee-1',
          title: 'Entregar equipamentos',
          description: 'Separar notebook e crachá para orientação interna',
          owner: 'IT',
          dueDate: '2026-08-05',
          reason: 'Internal onboarding checklist',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'task-1', legalValidationPending: true });

    expect(context.onboardingPlanFindUnique).toHaveBeenCalledWith({ where: { id: 'plan-1' } });
    expect(context.employeeFindUnique).toHaveBeenCalledWith({ where: { id: 'employee-1' } });
    expect(context.onboardingTaskCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          planId: 'plan-1',
          employeeId: 'employee-1',
          title: 'Entregar equipamentos',
          owner: 'IT',
          recordedBy: 'user-1',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'onboarding.task.created',
        entityType: 'OnboardingTask',
        entityId: 'task-1',
      }),
    );
  });

  it('rejects onboarding plans with inverted dates', async () => {
    const context = createOnboardingService();

    await expect(
      context.service.createPlan({
        companyId: 'company-1',
        employeeId: 'employee-1',
        name: 'Plano inválido',
        startDate: '2026-08-15',
        targetEndDate: '2026-08-01',
        reason: 'Invalid onboarding dates',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects onboarding tasks for a different employee than the plan employee', async () => {
    const context = createOnboardingService();
    context.employeeFindUnique.mockResolvedValue({ id: 'employee-2', companyId: 'company-1' });

    await expect(
      context.service.createTask({
        planId: 'plan-1',
        employeeId: 'employee-2',
        title: 'Tarefa inválida',
        reason: 'Invalid onboarding task employee',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects onboarding tasks for completed plans', async () => {
    const context = createOnboardingService();
    context.onboardingPlanFindUnique.mockResolvedValue({ id: 'plan-1', companyId: 'company-1', employeeId: 'employee-1', status: 'COMPLETED' });

    await expect(
      context.service.createTask({
        planId: 'plan-1',
        employeeId: 'employee-1',
        title: 'Tarefa bloqueada',
        reason: 'Invalid completed onboarding plan task',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
