import { Injectable } from '@nestjs/common';
import { logipayrollContractCreatedDataSchema, logipayrollLeaveApprovedEventSchema, logipayrollEmployeeAvailableEventSchema } from '@logipeople/event-contracts';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma';
import { LogiIdentityClaims } from '../auth/identity-jwks.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Injectable()
export class PayrollService {
  constructor(private readonly prisma: PrismaService) {}

  capabilities() {
    return {
      service: 'logipayroll',
      status: 'foundation',
      modules: [
        'contracts',
        'time-attendance',
        'leave',
        'benefits',
        'payroll-runs',
        'payslips',
        'terminations',
        'esocial',
      ],
      boundaries: {
        ownsSensitivePayrollData: true,
        exposesSalaryDetailsToLogiPeople: false,
        directDatabaseAccessFromOtherSystems: false,
      },
    };
  }

  async listContracts() {
    const contracts = await this.prisma.contract.findMany({
      orderBy: [{ startsAt: 'desc' }, { createdAt: 'desc' }],
      include: { employee: true },
    });

    return contracts.map((contract) => this.publicContract(contract));
  }

  async createContract(input: CreateContractDto, claims: LogiIdentityClaims, correlationId?: string) {
    const contract = await this.prisma.$transaction(async (tx) => {
      const employee = input.employee.logiPeopleId
        ? await tx.payrollEmployeeReference.upsert({
            where: { logiPeopleId: input.employee.logiPeopleId },
            update: {
              fullName: input.employee.fullName,
              status: 'ACTIVE',
              ...(input.employee.identityUserId !== undefined ? { identityUserId: input.employee.identityUserId } : {}),
              ...(input.employee.documentHash !== undefined ? { documentHash: input.employee.documentHash } : {}),
            },
            create: {
              logiPeopleId: input.employee.logiPeopleId,
              fullName: input.employee.fullName,
              ...(input.employee.identityUserId !== undefined ? { identityUserId: input.employee.identityUserId } : {}),
              ...(input.employee.documentHash !== undefined ? { documentHash: input.employee.documentHash } : {}),
            },
          })
        : await tx.payrollEmployeeReference.create({
            data: {
              fullName: input.employee.fullName,
              ...(input.employee.identityUserId !== undefined ? { identityUserId: input.employee.identityUserId } : {}),
              ...(input.employee.documentHash !== undefined ? { documentHash: input.employee.documentHash } : {}),
            },
          });

      const created = await tx.contract.create({
        data: {
          employeeId: employee.id,
          type: input.type,
          startsAt: new Date(input.startsAt),
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          status: input.status ?? 'ACTIVE',
        },
        include: { employee: true },
      });

      const eventPayload = logipayrollContractCreatedDataSchema.parse({
        contractId: created.id,
        employeeId: created.employeeId,
        identityUserId: created.employee.identityUserId,
        logiPeopleId: created.employee.logiPeopleId,
        status: created.status,
        startsAt: created.startsAt.toISOString(),
        endsAt: created.endsAt?.toISOString() ?? null,
      });

      await tx.outboxEvent.create({
        data: {
          eventType: 'logipayroll.contract.created',
          eventVersion: 1,
          correlationId: correlationId ?? null,
          causationId: claims.sessionId ?? null,
          payload: eventPayload as unknown as Prisma.InputJsonValue,
        },
      });

      return created;
    });

    return this.publicContract(contract);
  }

  
  async approveLeave(input: { employeeId: string; unavailableFrom: string; unavailableUntil: string; category: any }, claims: LogiIdentityClaims, correlationId?: string) {
    const eventPayload = logipayrollLeaveApprovedEventSchema.shape.data.parse({
      employeeId: input.employeeId,
      unavailableFrom: input.unavailableFrom,
      unavailableUntil: input.unavailableUntil,
      category: input.category,
    });

    const outboxEvent = await this.prisma.outboxEvent.create({
      data: {
        eventType: 'logipayroll.leave.approved',
        eventVersion: 1,
        correlationId: correlationId ?? null,
        causationId: claims.sessionId ?? null,
        payload: eventPayload as unknown as Prisma.InputJsonValue,
      },
    });

    // Also emit logipayroll.employee.unavailable directly to match the architecture expectation
    await this.prisma.outboxEvent.create({
      data: {
        eventType: 'logipayroll.employee.unavailable',
        eventVersion: 1,
        correlationId: correlationId ?? null,
        causationId: claims.sessionId ?? null,
        payload: {
          employeeId: input.employeeId,
          unavailableFrom: input.unavailableFrom,
          unavailableUntil: input.unavailableUntil,
          category: input.category,
        },
      },
    });

    return { success: true, eventId: outboxEvent.id };
  }

  async registerAvailability(input: { employeeId: string; availableFrom: string }, claims: LogiIdentityClaims, correlationId?: string) {
    const eventPayload = logipayrollEmployeeAvailableEventSchema.shape.data.parse({
      employeeId: input.employeeId,
      availableFrom: input.availableFrom,
    });

    const outboxEvent = await this.prisma.outboxEvent.create({
      data: {
        eventType: 'logipayroll.employee.available',
        eventVersion: 1,
        correlationId: correlationId ?? null,
        causationId: claims.sessionId ?? null,
        payload: eventPayload as unknown as Prisma.InputJsonValue,
      },
    });

    return { success: true, eventId: outboxEvent.id };
  }

  
  async listTimeRecords() {
    return this.prisma.timeRecord.findMany({
      orderBy: { timestamp: 'desc' },
      include: { employee: true },
    });
  }

  async createTimeRecord(input: any, claims: LogiIdentityClaims, correlationId?: string) {
    return this.prisma.timeRecord.create({
      data: {
        employeeId: input.employeeId,
        kind: input.kind,
        timestamp: new Date(input.timestamp),
      },
    });
  }

  async listLeaveRequests() {
    return this.prisma.leaveRequest.findMany({
      orderBy: { createdAt: 'desc' },
      include: { employee: true },
    });
  }

  async createLeaveRequest(input: any, claims: LogiIdentityClaims, correlationId?: string) {
    return this.prisma.leaveRequest.create({
      data: {
        employeeId: input.employeeId,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        category: input.category,
        reason: input.reason,
        status: 'REQUESTED',
      },
    });
  }

  async approveLeaveRequest(id: string, claims: LogiIdentityClaims, correlationId?: string) {
    const request = await this.prisma.leaveRequest.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    const eventPayload = logipayrollLeaveApprovedEventSchema.shape.data.parse({
      employeeId: request.employeeId,
      unavailableFrom: request.startDate.toISOString(),
      unavailableUntil: request.endDate.toISOString(),
      category: request.category as any,
    });

    await this.prisma.outboxEvent.create({
      data: {
        eventType: 'logipayroll.leave.approved',
        eventVersion: 1,
        correlationId: correlationId ?? null,
        causationId: claims.sessionId ?? null,
        payload: eventPayload as unknown as Prisma.InputJsonValue,
      },
    });

    await this.prisma.outboxEvent.create({
      data: {
        eventType: 'logipayroll.employee.unavailable',
        eventVersion: 1,
        correlationId: correlationId ?? null,
        causationId: claims.sessionId ?? null,
        payload: eventPayload as unknown as Prisma.InputJsonValue,
      },
    });

    return request;
  }

  
  async closePayrollRun(referenceMonth: number, referenceYear: number, claims: LogiIdentityClaims, correlationId?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Create or update the run
      const run = await tx.payrollRun.upsert({
        where: { referenceMonth_referenceYear: { referenceMonth, referenceYear } },
        update: { status: 'CLOSED' },
        create: { referenceMonth, referenceYear, status: 'CLOSED' },
      });

      // Find active contracts
      const activeContracts = await tx.contract.findMany({ where: { status: 'ACTIVE' } });
      let totalAmountCents = 0;

      for (const contract of activeContracts) {
        const amount = 300000; // 3000.00 BRL
        totalAmountCents += amount;

        await tx.payrollItem.create({
          data: {
            payrollRunId: run.id,
            employeeId: contract.employeeId,
            code: 'BASE_SALARY',
            description: 'Salario Base',
            kind: 'EARNING',
            amountCents: amount,
          },
        });
      }

      const { logipayrollPayrollClosedEventSchema } = require('@logipeople/event-contracts');
      
      const eventPayload = logipayrollPayrollClosedEventSchema.shape.data.parse({
        payrollRunId: run.id,
        referenceMonth: run.referenceMonth,
        referenceYear: run.referenceYear,
        totalEmployees: activeContracts.length,
        totalAmountCents: totalAmountCents,
      });

      await tx.outboxEvent.create({
        data: {
          eventType: 'logipayroll.payroll.closed',
          eventVersion: 1,
          correlationId: correlationId ?? null,
          causationId: claims.sessionId ?? null,
          payload: eventPayload as unknown as Prisma.InputJsonValue,
        },
      });

      return { success: true, runId: run.id, totalEmployees: activeContracts.length };
    });
  }

  private publicContract(contract: {
    id: string;
    type: string;
    startsAt: Date;
    endsAt: Date | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    employee: {
      id: string;
      identityUserId: string | null;
      logiPeopleId: string | null;
      fullName: string;
      status: string;
    };
  }) {
    return {
      id: contract.id,
      type: contract.type,
      startsAt: contract.startsAt.toISOString(),
      endsAt: contract.endsAt?.toISOString() ?? null,
      status: contract.status,
      createdAt: contract.createdAt.toISOString(),
      updatedAt: contract.updatedAt.toISOString(),
      employee: {
        id: contract.employee.id,
        identityUserId: contract.employee.identityUserId,
        logiPeopleId: contract.employee.logiPeopleId,
        fullName: contract.employee.fullName,
        status: contract.employee.status,
      },
    };
  }
}
