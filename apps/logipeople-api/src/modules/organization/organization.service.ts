import { Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listCompanies() {
    return this.prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: { departments: true, positions: true },
    });
  }

  async createCompany(input: CreateCompanyDto, principal?: AuthenticatedPrincipal) {
    const company = await this.prisma.company.create({ data: input });

    await this.audit.record({
      principal,
      action: 'organization.company.created',
      entityType: 'Company',
      entityId: company.id,
      after: { id: company.id, name: company.name },
      reason: 'Company created through LogiPeople API',
    });

    return company;
  }

  listDepartments() {
    return this.prisma.department.findMany({
      orderBy: [{ companyId: 'asc' }, { name: 'asc' }],
      include: { company: true },
    });
  }

  async createDepartment(input: CreateDepartmentDto, principal?: AuthenticatedPrincipal) {
    const company = await this.prisma.company.findUnique({ where: { id: input.companyId } });

    if (!company) {
      throw new NotFoundException({ error: 'Empresa não encontrada.' });
    }

    const department = await this.prisma.department.create({ data: input });

    await this.audit.record({
      principal,
      action: 'organization.department.created',
      entityType: 'Department',
      entityId: department.id,
      after: { id: department.id, name: department.name, companyId: department.companyId },
      reason: 'Department created through LogiPeople API',
    });

    return department;
  }

  listPositions() {
    return this.prisma.position.findMany({
      orderBy: [{ companyId: 'asc' }, { title: 'asc' }],
      include: { company: true, department: true, job: true },
    });
  }

  async createPosition(input: CreatePositionDto, principal?: AuthenticatedPrincipal) {
    const department = await this.prisma.department.findUnique({ where: { id: input.departmentId } });

    if (!department) {
      throw new NotFoundException({ error: 'Departamento não encontrado.' });
    }

    const position = await this.prisma.position.create({
      data: {
        companyId: input.companyId,
        departmentId: input.departmentId,
        ...(input.jobId ? { jobId: input.jobId } : {}),
        title: input.title,
        status: input.status ?? 'VACANT',
      },
    });

    await this.audit.record({
      principal,
      action: 'organization.position.created',
      entityType: 'Position',
      entityId: position.id,
      after: { id: position.id, title: position.title, companyId: position.companyId },
      reason: 'Position created through LogiPeople API',
    });

    return position;
  }
}
