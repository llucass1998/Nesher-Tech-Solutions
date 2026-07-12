import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendancePeriodDto } from './dto/create-attendance-period.dto';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';

@Injectable()
export class TimeAttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listWorkSchedules() {
    return this.prisma.workSchedule.findMany({
      orderBy: [{ companyId: 'asc' }, { effectiveFrom: 'desc' }],
      include: { company: true, employee: { include: { person: true } } },
    });
  }

  async createWorkSchedule(input: CreateWorkScheduleDto, principal?: AuthenticatedPrincipal) {
    await this.ensureCompanyExists(input.companyId);

    if (input.employeeId) {
      await this.ensureEmployeeInCompany(input.employeeId, input.companyId);
    }

    const effectiveFrom = this.parseDate(input.effectiveFrom, 'Data inicial da jornada inválida.');
    const effectiveTo = input.effectiveTo ? this.parseDate(input.effectiveTo, 'Data final da jornada inválida.') : undefined;

    if (effectiveTo && effectiveTo < effectiveFrom) {
      throw new BadRequestException({ error: 'Data final da jornada não pode ser anterior à data inicial.' });
    }

    const schedule = await this.prisma.workSchedule.create({
      data: {
        companyId: input.companyId,
        ...(input.employeeId ? { employeeId: input.employeeId } : {}),
        name: input.name,
        weeklyMinutes: input.weeklyMinutes,
        workDays: input.workDays,
        effectiveFrom,
        ...(effectiveTo ? { effectiveTo } : {}),
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'time-attendance.work-schedule.created',
      entityType: 'WorkSchedule',
      entityId: schedule.id,
      after: { id: schedule.id, companyId: schedule.companyId, employeeId: schedule.employeeId, weeklyMinutes: schedule.weeklyMinutes },
      reason: 'Work schedule created through LogiPeople API',
    });

    return schedule;
  }

  listTimeEntries() {
    return this.prisma.timeEntry.findMany({
      orderBy: { occurredAt: 'desc' },
      take: 100,
      include: { employee: { include: { person: true, company: true } } },
    });
  }

  async createTimeEntry(input: CreateTimeEntryDto, principal?: AuthenticatedPrincipal) {
    await this.ensureEmployeeExists(input.employeeId);
    const occurredAt = this.parseDate(input.occurredAt, 'Data e hora da marcação inválida.');

    const entry = await this.prisma.timeEntry.create({
      data: {
        employeeId: input.employeeId,
        kind: input.kind,
        occurredAt,
        source: input.source ?? 'MANUAL',
        ...(input.notes ? { notes: input.notes } : {}),
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
      },
    });

    await this.audit.record({
      principal,
      action: 'time-attendance.time-entry.created',
      entityType: 'TimeEntry',
      entityId: entry.id,
      after: { id: entry.id, employeeId: entry.employeeId, kind: entry.kind, occurredAt: entry.occurredAt.toISOString() },
      reason: 'Time entry created through LogiPeople API',
    });

    return entry;
  }

  listAttendancePeriods() {
    return this.prisma.attendancePeriod.findMany({
      orderBy: [{ periodEnd: 'desc' }, { employeeId: 'asc' }],
      take: 100,
      include: { company: true, employee: { include: { person: true } } },
    });
  }

  async createAttendancePeriod(input: CreateAttendancePeriodDto, principal?: AuthenticatedPrincipal) {
    await this.ensureCompanyExists(input.companyId);
    await this.ensureEmployeeInCompany(input.employeeId, input.companyId);

    const periodStart = this.parseDate(input.periodStart, 'Data inicial do período inválida.');
    const periodEnd = this.parseDate(input.periodEnd, 'Data final do período inválida.');

    if (periodEnd < periodStart) {
      throw new BadRequestException({ error: 'Data final do período não pode ser anterior à data inicial.' });
    }

    const period = await this.prisma.attendancePeriod.create({
      data: {
        companyId: input.companyId,
        employeeId: input.employeeId,
        periodStart,
        periodEnd,
        plannedMinutes: input.plannedMinutes,
        workedMinutes: input.workedMinutes,
        absenceMinutes: input.absenceMinutes,
        extraMinutes: input.extraMinutes,
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'time-attendance.attendance-period.created',
      entityType: 'AttendancePeriod',
      entityId: period.id,
      after: {
        id: period.id,
        employeeId: period.employeeId,
        periodStart: period.periodStart.toISOString(),
        periodEnd: period.periodEnd.toISOString(),
        legalValidationPending: period.legalValidationPending,
      },
      reason: 'Attendance period created through LogiPeople API',
    });

    return period;
  }

  private async ensureCompanyExists(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });

    if (!company) {
      throw new NotFoundException({ error: 'Empresa não encontrada.' });
    }
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
