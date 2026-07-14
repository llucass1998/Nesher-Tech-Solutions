import { Injectable } from '@nestjs/common';
import { logipayrollContractCreatedDataSchema } from '@logipeople/event-contracts';
import { PrismaService } from '../../prisma/prisma.service';
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
          payload: eventPayload,
        },
      });

      return created;
    });

    return this.publicContract(contract);
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
