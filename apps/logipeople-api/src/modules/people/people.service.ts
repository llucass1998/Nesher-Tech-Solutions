import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreatePersonDto } from './dto/create-person.dto';

@Injectable()
export class PeopleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPersons() {
    return this.prisma.person.findMany({
      orderBy: { fullName: 'asc' },
      select: {
        id: true,
        fullName: true,
        preferredName: true,
        corporateEmail: true,
        phone: true,
        dataClassification: true,
        employee: { select: { id: true, employeeNumber: true, status: true } },
      },
    });
  }

  async createPerson(input: CreatePersonDto, principal?: AuthenticatedPrincipal) {
    const person = await this.prisma.person.create({
      data: {
        ...input,
        dataClassification: input.dataClassification ?? 'CONFIDENTIAL',
      },
    });

    await this.audit.record({
      principal,
      action: 'people.person.created',
      entityType: 'Person',
      entityId: person.id,
      after: { id: person.id, fullName: person.fullName, corporateEmail: person.corporateEmail },
      reason: 'Person created through LogiPeople API',
    });

    return person;
  }

  listEmployees() {
    return this.prisma.employee.findMany({
      orderBy: { employeeNumber: 'asc' },
      include: {
        person: true,
        company: true,
        position: true,
      },
    });
  }

  async createEmployee(input: CreateEmployeeDto, principal?: AuthenticatedPrincipal) {
    const person = await this.prisma.person.findUnique({ where: { id: input.personId } });

    if (!person) {
      throw new NotFoundException({ error: 'Pessoa não encontrada.' });
    }

    const company = await this.prisma.company.findUnique({ where: { id: input.companyId } });

    if (!company) {
      throw new NotFoundException({ error: 'Empresa não encontrada.' });
    }

    if (input.positionId) {
      const position = await this.prisma.position.findUnique({ where: { id: input.positionId } });

      if (!position) {
        throw new NotFoundException({ error: 'Posição não encontrada.' });
      }
    }

    const hireDate = new Date(input.hireDate);

    const employee = await this.prisma.$transaction(async (tx) => {
      const created = await tx.employee.create({
        data: {
          personId: input.personId,
          companyId: input.companyId,
          ...(input.positionId ? { positionId: input.positionId } : {}),
          employeeNumber: input.employeeNumber,
          hireDate,
          status: 'ACTIVE',
        },
      });

      await tx.employeeStatusHistory.create({
        data: {
          employeeId: created.id,
          status: 'ACTIVE',
          effectiveFrom: hireDate,
          recordedBy: principal?.userId ?? 'system',
          reason: 'Initial employee creation',
          source: 'logipeople-api',
        },
      });

      await tx.employmentHistory.create({
        data: {
          employeeId: created.id,
          eventType: 'HIRED',
          description: 'Employee created in Core People',
          effectiveFrom: hireDate,
          recordedBy: principal?.userId ?? 'system',
          reason: 'Initial employee creation',
          source: 'logipeople-api',
        },
      });

      if (input.positionId) {
        await tx.positionAssignment.create({
          data: {
            employeeId: created.id,
            positionId: input.positionId,
            effectiveFrom: hireDate,
            recordedBy: principal?.userId ?? 'system',
            reason: 'Initial position assignment',
            source: 'logipeople-api',
          },
        });
      }

      return created;
    });

    await this.audit.record({
      principal,
      action: 'people.employee.created',
      entityType: 'Employee',
      entityId: employee.id,
      after: { id: employee.id, employeeNumber: employee.employeeNumber, companyId: employee.companyId },
      reason: 'Employee created through LogiPeople API',
    });

    return employee;
  }

  async getEmployeeTimeline(id: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });

    if (!employee) {
      throw new NotFoundException({ error: 'Colaborador não encontrado.' });
    }

    const [histories, statuses, positions, departments, managers, costCenters, compensation] = await Promise.all([
      this.prisma.employmentHistory.findMany({ where: { employeeId: id }, orderBy: { effectiveFrom: 'asc' } }),
      this.prisma.employeeStatusHistory.findMany({ where: { employeeId: id }, orderBy: { effectiveFrom: 'asc' } }),
      this.prisma.positionAssignment.findMany({ where: { employeeId: id }, orderBy: { effectiveFrom: 'asc' }, include: { position: true } }),
      this.prisma.departmentAssignment.findMany({ where: { employeeId: id }, orderBy: { effectiveFrom: 'asc' }, include: { department: true } }),
      this.prisma.managerAssignment.findMany({ where: { employeeId: id }, orderBy: { effectiveFrom: 'asc' }, include: { manager: { include: { person: true } } } }),
      this.prisma.costCenterAssignment.findMany({ where: { employeeId: id }, orderBy: { effectiveFrom: 'asc' }, include: { costCenter: true } }),
      this.prisma.compensationHistory.findMany({ where: { employeeId: id }, orderBy: { effectiveFrom: 'asc' } }),
    ]);

    return {
      employeeId: id,
      histories,
      statuses,
      positions,
      departments,
      managers,
      costCenters,
      compensation: compensation.map((item) => ({
        id: item.id,
        currency: item.currency,
        dataClassification: item.dataClassification,
        effectiveFrom: item.effectiveFrom,
        effectiveTo: item.effectiveTo,
        recordedAt: item.recordedAt,
        reason: item.reason,
        source: item.source,
      })),
    };
  }

  async getEmployeeAsOf(id: string, dateText?: string) {
    if (!dateText) {
      throw new BadRequestException({ error: 'Parâmetro date é obrigatório.' });
    }

    const date = new Date(dateText);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException({ error: 'Parâmetro date inválido.' });
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: { person: true, company: true },
    });

    if (!employee) {
      throw new NotFoundException({ error: 'Colaborador não encontrado.' });
    }

    const activeRange = {
      employeeId: id,
      effectiveFrom: { lte: date },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: date } }],
    };

    const [status, position, department, manager, costCenter] = await Promise.all([
      this.prisma.employeeStatusHistory.findFirst({ where: activeRange, orderBy: { effectiveFrom: 'desc' } }),
      this.prisma.positionAssignment.findFirst({ where: activeRange, orderBy: { effectiveFrom: 'desc' }, include: { position: true } }),
      this.prisma.departmentAssignment.findFirst({ where: activeRange, orderBy: { effectiveFrom: 'desc' }, include: { department: true } }),
      this.prisma.managerAssignment.findFirst({ where: activeRange, orderBy: { effectiveFrom: 'desc' }, include: { manager: { include: { person: true } } } }),
      this.prisma.costCenterAssignment.findFirst({ where: activeRange, orderBy: { effectiveFrom: 'desc' }, include: { costCenter: true } }),
    ]);

    return {
      asOf: date.toISOString(),
      employee,
      status,
      position,
      department,
      manager,
      costCenter,
    };
  }
}
