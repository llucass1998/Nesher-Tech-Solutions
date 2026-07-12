import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { Prisma } from '../../generated/prisma';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePayrollCycleDto } from './dto/create-payroll-cycle.dto';
import { CreatePayrollItemDto } from './dto/create-payroll-item.dto';
import { CreatePayrollRunDto } from './dto/create-payroll-run.dto';
import { RequestPayrollReopeningDto } from './dto/request-payroll-reopening.dto';

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listCycles() {
    return this.prisma.payrollCycle.findMany({
      orderBy: [{ referenceYear: 'desc' }, { referenceMonth: 'desc' }, { companyId: 'asc' }],
      include: { company: true, _count: { select: { runs: true, reopenings: true } } },
    });
  }

  async createCycle(input: CreatePayrollCycleDto, principal?: AuthenticatedPrincipal) {
    await this.ensureCompanyExists(input.companyId);

    const periodStart = this.parseDate(input.periodStart, 'Data inicial do ciclo de folha inválida.');
    const periodEnd = this.parseDate(input.periodEnd, 'Data final do ciclo de folha inválida.');

    if (periodEnd < periodStart) {
      throw new BadRequestException({ error: 'Data final do ciclo não pode ser anterior à data inicial.' });
    }

    const cycle = await this.prisma.payrollCycle.create({
      data: {
        companyId: input.companyId,
        name: input.name,
        referenceMonth: input.referenceMonth,
        referenceYear: input.referenceYear,
        periodStart,
        periodEnd,
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'payroll.cycle.created',
      entityType: 'PayrollCycle',
      entityId: cycle.id,
      after: {
        id: cycle.id,
        companyId: cycle.companyId,
        referenceMonth: cycle.referenceMonth,
        referenceYear: cycle.referenceYear,
        legalValidationPending: cycle.legalValidationPending,
      },
      reason: 'Payroll cycle created through LogiPeople API',
    });

    return cycle;
  }

  listRuns() {
    return this.prisma.payrollRun.findMany({
      orderBy: [{ createdAt: 'desc' }, { employeeId: 'asc' }],
      take: 100,
      include: { cycle: true, company: true, employee: { include: { person: true } }, _count: { select: { items: true } } },
    });
  }

  async createRun(input: CreatePayrollRunDto, principal?: AuthenticatedPrincipal) {
    const cycle = await this.ensureCycleExists(input.cycleId);
    await this.ensureCompanyExists(input.companyId);
    await this.ensureEmployeeInCompany(input.employeeId, input.companyId);

    if (cycle.companyId !== input.companyId) {
      throw new BadRequestException({ error: 'Ciclo de folha não pertence à empresa informada.' });
    }

    if (cycle.status === 'CLOSED') {
      throw new BadRequestException({ error: 'Folha fechada não pode receber novos demonstrativos sem reabertura auditada.' });
    }

    const run = await this.prisma.payrollRun.create({
      data: {
        cycleId: input.cycleId,
        companyId: input.companyId,
        employeeId: input.employeeId,
        grossAmount: this.toMoney(input.grossAmount ?? '0'),
        deductionAmount: this.toMoney(input.deductionAmount ?? '0'),
        netAmount: this.toMoney(input.netAmount ?? '0'),
        currency: input.currency ?? 'BRL',
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'payroll.run.created',
      entityType: 'PayrollRun',
      entityId: run.id,
      after: {
        id: run.id,
        cycleId: run.cycleId,
        employeeId: run.employeeId,
        legalValidationPending: run.legalValidationPending,
      },
      reason: 'Payroll run created through LogiPeople API',
    });

    return run;
  }

  listItems() {
    return this.prisma.payrollItem.findMany({
      orderBy: [{ createdAt: 'desc' }, { code: 'asc' }],
      take: 100,
      include: { run: { include: { cycle: true } }, employee: { include: { person: true } } },
    });
  }

  async createItem(input: CreatePayrollItemDto, principal?: AuthenticatedPrincipal) {
    const run = await this.prisma.payrollRun.findUnique({ where: { id: input.runId }, include: { cycle: true } });

    if (!run) {
      throw new NotFoundException({ error: 'Demonstrativo de folha não encontrado.' });
    }

    if (run.employeeId !== input.employeeId) {
      throw new BadRequestException({ error: 'Item de folha deve pertencer ao colaborador do demonstrativo.' });
    }

    if (run.status === 'CLOSED' || run.cycle.status === 'CLOSED') {
      throw new BadRequestException({ error: 'Folha fechada não pode receber itens sem reabertura auditada.' });
    }

    const item = await this.prisma.payrollItem.create({
      data: {
        runId: input.runId,
        employeeId: input.employeeId,
        type: input.type,
        source: input.source ?? 'MANUAL',
        code: input.code,
        description: input.description,
        ...(input.quantity ? { quantity: this.toQuantity(input.quantity) } : {}),
        amount: this.toMoney(input.amount),
        currency: input.currency ?? 'BRL',
        taxable: input.taxable ?? false,
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
      },
    });

    await this.audit.record({
      principal,
      action: 'payroll.item.created',
      entityType: 'PayrollItem',
      entityId: item.id,
      after: {
        id: item.id,
        runId: item.runId,
        employeeId: item.employeeId,
        type: item.type,
        code: item.code,
        legalValidationPending: item.legalValidationPending,
      },
      reason: 'Payroll item created through LogiPeople API',
    });

    return item;
  }

  async requestReopening(input: RequestPayrollReopeningDto, principal?: AuthenticatedPrincipal) {
    const cycle = await this.ensureCycleExists(input.cycleId);

    if (cycle.status !== 'CLOSED') {
      throw new BadRequestException({ error: 'Somente ciclos de folha fechados podem receber solicitação de reabertura.' });
    }

    const reopening = await this.prisma.payrollReopening.create({
      data: {
        cycleId: input.cycleId,
        requestedBy: principal?.userId ?? 'system',
        reason: input.reason,
      },
    });

    await this.audit.record({
      principal,
      action: 'payroll.reopening.requested',
      entityType: 'PayrollReopening',
      entityId: reopening.id,
      after: { id: reopening.id, cycleId: reopening.cycleId, status: reopening.status },
      reason: 'Payroll reopening requested through LogiPeople API',
    });

    return reopening;
  }

  private async ensureCompanyExists(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });

    if (!company) {
      throw new NotFoundException({ error: 'Empresa não encontrada.' });
    }

    return company;
  }

  private async ensureCycleExists(cycleId: string) {
    const cycle = await this.prisma.payrollCycle.findUnique({ where: { id: cycleId } });

    if (!cycle) {
      throw new NotFoundException({ error: 'Ciclo de folha não encontrado.' });
    }

    return cycle;
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

  private toQuantity(value: string) {
    return new Prisma.Decimal(value);
  }
}
