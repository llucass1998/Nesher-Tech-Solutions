import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOnboardingPlanDto } from './dto/create-onboarding-plan.dto';
import { CreateOnboardingTaskDto } from './dto/create-onboarding-task.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPlans() {
    return this.prisma.onboardingPlan.findMany({
      orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: { company: true, employee: { include: { person: true } }, _count: { select: { tasks: true } } },
    });
  }

  async createPlan(input: CreateOnboardingPlanDto, principal?: AuthenticatedPrincipal) {
    await this.ensureCompanyExists(input.companyId);
    await this.ensureEmployeeInCompany(input.employeeId, input.companyId);

    const startDate = this.parseDate(input.startDate, 'Data inicial do onboarding inválida.');
    const targetEndDate = input.targetEndDate ? this.parseDate(input.targetEndDate, 'Data alvo do onboarding inválida.') : undefined;

    if (targetEndDate && targetEndDate < startDate) {
      throw new BadRequestException({ error: 'Data alvo do onboarding não pode ser anterior à data inicial.' });
    }

    const plan = await this.prisma.onboardingPlan.create({
      data: {
        companyId: input.companyId,
        employeeId: input.employeeId,
        name: input.name,
        startDate,
        ...(targetEndDate ? { targetEndDate } : {}),
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'onboarding.plan.created',
      entityType: 'OnboardingPlan',
      entityId: plan.id,
      after: {
        id: plan.id,
        companyId: plan.companyId,
        employeeId: plan.employeeId,
        status: plan.status,
        legalValidationPending: plan.legalValidationPending,
      },
      reason: 'Onboarding plan created through LogiPeople API',
    });

    return plan;
  }

  listTasks() {
    return this.prisma.onboardingTask.findMany({
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      take: 100,
      include: { plan: { include: { company: true } }, employee: { include: { person: true } } },
    });
  }

  async createTask(input: CreateOnboardingTaskDto, principal?: AuthenticatedPrincipal) {
    const plan = await this.ensurePlanExists(input.planId);
    const employee = await this.ensureEmployeeExists(input.employeeId);

    if (employee.companyId !== plan.companyId) {
      throw new BadRequestException({ error: 'Colaborador da tarefa não pertence à empresa do plano de onboarding.' });
    }

    if (employee.id !== plan.employeeId) {
      throw new BadRequestException({ error: 'Tarefa de onboarding deve pertencer ao colaborador do plano nesta fundação.' });
    }

    if (plan.status === 'COMPLETED' || plan.status === 'CANCELLED') {
      throw new BadRequestException({ error: 'Plano de onboarding concluído ou cancelado não pode receber novas tarefas.' });
    }

    const task = await this.prisma.onboardingTask.create({
      data: {
        planId: input.planId,
        employeeId: input.employeeId,
        title: input.title,
        ...(input.description ? { description: input.description } : {}),
        owner: input.owner ?? 'HR',
        ...(input.dueDate ? { dueDate: this.parseDate(input.dueDate, 'Data de vencimento da tarefa inválida.') } : {}),
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'onboarding.task.created',
      entityType: 'OnboardingTask',
      entityId: task.id,
      after: {
        id: task.id,
        planId: task.planId,
        employeeId: task.employeeId,
        owner: task.owner,
        status: task.status,
        legalValidationPending: task.legalValidationPending,
      },
      reason: 'Onboarding task created through LogiPeople API',
    });

    return task;
  }

  private async ensureCompanyExists(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });

    if (!company) {
      throw new NotFoundException({ error: 'Empresa não encontrada.' });
    }

    return company;
  }

  private async ensureEmployeeExists(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });

    if (!employee) {
      throw new NotFoundException({ error: 'Colaborador não encontrado.' });
    }

    return employee;
  }

  private async ensureEmployeeInCompany(employeeId: string, companyId: string) {
    const employee = await this.ensureEmployeeExists(employeeId);

    if (employee.companyId !== companyId) {
      throw new BadRequestException({ error: 'Colaborador não pertence à empresa informada.' });
    }

    return employee;
  }

  private async ensurePlanExists(planId: string) {
    const plan = await this.prisma.onboardingPlan.findUnique({ where: { id: planId } });

    if (!plan) {
      throw new NotFoundException({ error: 'Plano de onboarding não encontrado.' });
    }

    return plan;
  }

  private parseDate(value: string, message: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException({ error: message });
    }

    return parsed;
  }
}
