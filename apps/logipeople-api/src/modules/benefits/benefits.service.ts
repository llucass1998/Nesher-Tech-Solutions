import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { Prisma } from '../../generated/prisma';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBenefitEnrollmentDto } from './dto/create-benefit-enrollment.dto';
import { CreateBenefitPlanDto } from './dto/create-benefit-plan.dto';

@Injectable()
export class BenefitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPlans() {
    return this.prisma.benefitPlan.findMany({
      orderBy: [{ companyId: 'asc' }, { name: 'asc' }],
      include: { company: true, _count: { select: { enrollments: true } } },
    });
  }

  async createPlan(input: CreateBenefitPlanDto, principal?: AuthenticatedPrincipal) {
    await this.ensureCompanyExists(input.companyId);

    const effectiveFrom = this.parseDate(input.effectiveFrom, 'Data inicial do benefício inválida.');
    const effectiveTo = input.effectiveTo ? this.parseDate(input.effectiveTo, 'Data final do benefício inválida.') : undefined;

    if (effectiveTo && effectiveTo < effectiveFrom) {
      throw new BadRequestException({ error: 'Data final do benefício não pode ser anterior à data inicial.' });
    }

    const plan = await this.prisma.benefitPlan.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        providerName: input.providerName,
        type: input.type,
        employerCostAmount: this.toMoney(input.employerCostAmount ?? '0'),
        employeeCostAmount: this.toMoney(input.employeeCostAmount ?? '0'),
        currency: input.currency ?? 'BRL',
        effectiveFrom,
        ...(effectiveTo ? { effectiveTo } : {}),
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'benefits.plan.created',
      entityType: 'BenefitPlan',
      entityId: plan.id,
      after: {
        id: plan.id,
        companyId: plan.companyId,
        type: plan.type,
        status: plan.status,
        legalValidationPending: plan.legalValidationPending,
      },
      reason: 'Benefit plan created through LogiPeople API',
    });

    return plan;
  }

  listEnrollments() {
    return this.prisma.benefitEnrollment.findMany({
      orderBy: [{ createdAt: 'desc' }, { employeeId: 'asc' }],
      take: 100,
      include: { plan: { include: { company: true } }, employee: { include: { person: true } } },
    });
  }

  async createEnrollment(input: CreateBenefitEnrollmentDto, principal?: AuthenticatedPrincipal) {
    const plan = await this.ensurePlanExists(input.planId);

    if (plan.companyId !== input.companyId) {
      throw new BadRequestException({ error: 'Plano de benefício não pertence à empresa informada.' });
    }

    await this.ensureEmployeeInCompany(input.employeeId, input.companyId);

    if (plan.status === 'INACTIVE') {
      throw new BadRequestException({ error: 'Plano de benefício inativo não pode receber novas adesões.' });
    }

    const effectiveFrom = this.parseDate(input.effectiveFrom, 'Data inicial da adesão inválida.');
    const effectiveTo = input.effectiveTo ? this.parseDate(input.effectiveTo, 'Data final da adesão inválida.') : undefined;

    if (effectiveTo && effectiveTo < effectiveFrom) {
      throw new BadRequestException({ error: 'Data final da adesão não pode ser anterior à data inicial.' });
    }

    const enrollment = await this.prisma.benefitEnrollment.create({
      data: {
        planId: input.planId,
        employeeId: input.employeeId,
        coverageLevel: input.coverageLevel,
        employeeCostAmount: this.toMoney(input.employeeCostAmount ?? '0'),
        employerCostAmount: this.toMoney(input.employerCostAmount ?? '0'),
        currency: input.currency ?? 'BRL',
        effectiveFrom,
        ...(effectiveTo ? { effectiveTo } : {}),
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'benefits.enrollment.created',
      entityType: 'BenefitEnrollment',
      entityId: enrollment.id,
      after: {
        id: enrollment.id,
        planId: enrollment.planId,
        employeeId: enrollment.employeeId,
        status: enrollment.status,
        legalValidationPending: enrollment.legalValidationPending,
      },
      reason: 'Benefit enrollment created through LogiPeople API',
    });

    return enrollment;
  }

  private async ensureCompanyExists(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });

    if (!company) {
      throw new NotFoundException({ error: 'Empresa não encontrada.' });
    }

    return company;
  }

  private async ensurePlanExists(planId: string) {
    const plan = await this.prisma.benefitPlan.findUnique({ where: { id: planId } });

    if (!plan) {
      throw new NotFoundException({ error: 'Plano de benefício não encontrado.' });
    }

    return plan;
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
      throw new BadRequestException({ error: 'Colaborador não pertence à empresa do plano de benefício.' });
    }

    return employee;
  }

  private parseDate(value: string, message: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException({ error: message });
    }

    return parsed;
  }

  private toMoney(value: string) {
    return new Prisma.Decimal(value);
  }
}
