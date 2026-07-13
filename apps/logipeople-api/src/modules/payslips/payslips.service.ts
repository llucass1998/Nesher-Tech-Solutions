import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedPrincipal, isSuperAdmin } from '@logipeople/auth';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePayslipDto } from './dto/create-payslip.dto';

@Injectable()
export class PayslipsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listPayslips() {
    return this.prisma.payslip.findMany({
      orderBy: [{ createdAt: 'desc' }, { employeeId: 'asc' }],
      take: 100,
      include: {
        payrollRun: { include: { cycle: true } },
        company: true,
        employee: { include: { person: true } },
        _count: { select: { lines: true } },
      },
    });
  }

  listLines() {
    return this.prisma.payslipLine.findMany({
      orderBy: [{ createdAt: 'desc' }, { code: 'asc' }],
      take: 100,
      include: {
        payslip: { include: { payrollRun: { include: { cycle: true } } } },
        employee: { include: { person: true } },
      },
    });
  }

  async createPayslip(input: CreatePayslipDto, principal?: AuthenticatedPrincipal) {
    const run = await this.prisma.payrollRun.findUnique({
      where: { id: input.payrollRunId },
      include: { cycle: true, items: true },
    });

    if (!run) {
      throw new NotFoundException({ error: 'Payroll run not found.' });
    }

    if (run.status === 'CLOSED' || run.cycle.status === 'CLOSED') {
      throw new BadRequestException({ error: 'Closed payroll cannot generate demonstrative payslips without audited reopening.' });
    }

    this.ensureCompanyScope(run.companyId, principal);

    const existing = await this.prisma.payslip.findUnique({ where: { payrollRunId: input.payrollRunId } });

    if (existing) {
      return existing;
    }

    const recordedBy = principal?.userId ?? 'system';
    const payslip = await this.prisma.payslip.create({
      data: {
        payrollRunId: run.id,
        companyId: run.companyId,
        employeeId: run.employeeId,
        referenceMonth: run.cycle.referenceMonth,
        referenceYear: run.cycle.referenceYear,
        grossAmount: run.grossAmount,
        deductionAmount: run.deductionAmount,
        netAmount: run.netAmount,
        currency: run.currency,
        visibleToEmployee: false,
        recordedBy,
        reason: input.reason,
        source: 'logipeople-api',
        lines: {
          create: run.items.map((item) => ({
            payrollItemId: item.id,
            employeeId: item.employeeId,
            type: item.type,
            code: item.code,
            description: item.description,
            ...(item.quantity ? { quantity: item.quantity } : {}),
            amount: item.amount,
            currency: item.currency,
            recordedBy,
            reason: input.reason,
          })),
        },
      },
      include: { lines: true },
    });

    await this.audit.record({
      principal,
      action: 'payslip.created',
      entityType: 'Payslip',
      entityId: payslip.id,
      after: {
        id: payslip.id,
        payrollRunId: payslip.payrollRunId,
        employeeId: payslip.employeeId,
        visibleToEmployee: payslip.visibleToEmployee,
        legalValidationPending: payslip.legalValidationPending,
        lines: payslip.lines.length,
      },
      reason: 'Payslip demonstrative record created through LogiPeople API',
    });

    return payslip;
  }

  private ensureCompanyScope(companyId: string, principal?: AuthenticatedPrincipal) {
    if (!principal || isSuperAdmin(principal)) {
      return;
    }

    const hasCompanyScope = principal.scopes.some((scope) => scope.type === 'COMPANY' && scope.id === companyId);

    if (!hasCompanyScope) {
      throw new ForbiddenException({ error: 'Escopo de acesso insuficiente.' });
    }
  }
}
