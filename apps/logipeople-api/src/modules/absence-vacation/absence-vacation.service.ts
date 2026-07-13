import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAbsenceRequestDto } from './dto/create-absence-request.dto';
import { CreateVacationPeriodDto } from './dto/create-vacation-period.dto';

@Injectable()
export class AbsenceVacationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listAbsenceRequests() {
    return this.prisma.absenceRequest.findMany({
      orderBy: [{ startDate: 'desc' }, { employeeId: 'asc' }],
      take: 100,
      include: { company: true, employee: { include: { person: true } } },
    });
  }

  async createAbsenceRequest(input: CreateAbsenceRequestDto, principal?: AuthenticatedPrincipal) {
    await this.ensureCompanyExists(input.companyId);
    await this.ensureEmployeeInCompany(input.employeeId, input.companyId);

    const startDate = this.parseDate(input.startDate, 'Data inicial da ausência inválida.');
    const endDate = this.parseDate(input.endDate, 'Data final da ausência inválida.');

    if (endDate < startDate) {
      throw new BadRequestException({ error: 'Data final da ausência não pode ser anterior à data inicial.' });
    }

    const absenceRequest = await this.prisma.absenceRequest.create({
      data: {
        companyId: input.companyId,
        employeeId: input.employeeId,
        type: input.type,
        startDate,
        endDate,
        totalDays: input.totalDays,
        ...(input.notes ? { notes: input.notes } : {}),
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'absence-vacation.absence-request.created',
      entityType: 'AbsenceRequest',
      entityId: absenceRequest.id,
      after: {
        id: absenceRequest.id,
        companyId: absenceRequest.companyId,
        employeeId: absenceRequest.employeeId,
        type: absenceRequest.type,
        status: absenceRequest.status,
        legalValidationPending: absenceRequest.legalValidationPending,
      },
      reason: 'Absence request created through LogiPeople API',
    });

    return absenceRequest;
  }

  listVacationPeriods() {
    return this.prisma.vacationPeriod.findMany({
      orderBy: [{ periodStart: 'desc' }, { employeeId: 'asc' }],
      take: 100,
      include: { company: true, employee: { include: { person: true } } },
    });
  }

  async createVacationPeriod(input: CreateVacationPeriodDto, principal?: AuthenticatedPrincipal) {
    await this.ensureCompanyExists(input.companyId);
    await this.ensureEmployeeInCompany(input.employeeId, input.companyId);

    const accrualStart = this.parseDate(input.accrualStart, 'Data inicial do período aquisitivo inválida.');
    const accrualEnd = this.parseDate(input.accrualEnd, 'Data final do período aquisitivo inválida.');
    const periodStart = this.parseDate(input.periodStart, 'Data inicial das férias inválida.');
    const periodEnd = this.parseDate(input.periodEnd, 'Data final das férias inválida.');

    if (accrualEnd < accrualStart) {
      throw new BadRequestException({ error: 'Data final do período aquisitivo não pode ser anterior à data inicial.' });
    }

    if (periodEnd < periodStart) {
      throw new BadRequestException({ error: 'Data final das férias não pode ser anterior à data inicial.' });
    }

    const vacationPeriod = await this.prisma.vacationPeriod.create({
      data: {
        companyId: input.companyId,
        employeeId: input.employeeId,
        accrualStart,
        accrualEnd,
        periodStart,
        periodEnd,
        days: input.days,
        ...(input.notes ? { notes: input.notes } : {}),
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'absence-vacation.vacation-period.created',
      entityType: 'VacationPeriod',
      entityId: vacationPeriod.id,
      after: {
        id: vacationPeriod.id,
        companyId: vacationPeriod.companyId,
        employeeId: vacationPeriod.employeeId,
        status: vacationPeriod.status,
        legalValidationPending: vacationPeriod.legalValidationPending,
      },
      reason: 'Vacation period created through LogiPeople API',
    });

    return vacationPeriod;
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

  private parseDate(value: string, message: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException({ error: message });
    }

    return parsed;
  }
}
