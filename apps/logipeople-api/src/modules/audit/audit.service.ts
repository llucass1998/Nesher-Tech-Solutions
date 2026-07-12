import { Injectable } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { Prisma } from '../../generated/prisma';
import { PrismaService } from '../../prisma/prisma.service';

interface AuditInput {
  principal?: AuthenticatedPrincipal | undefined;
  action: string;
  entityType: string;
  entityId: string;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  reason?: string;
  requestId?: string;
  correlationId?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(input: AuditInput) {
    const actorRole = input.principal?.roles[0] ?? 'SYSTEM';

    await this.prisma.auditLog.create({
      data: {
        ...(input.principal?.employeeId ? { actorId: input.principal.employeeId } : {}),
        actorRole,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        ...(input.before ? { before: input.before } : {}),
        ...(input.after ? { after: input.after } : {}),
        ...(input.reason ? { reason: input.reason } : {}),
        ...(input.requestId ? { requestId: input.requestId } : {}),
        ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      },
    });
  }

  async recordSensitiveAccess(input: {
    principal: AuthenticatedPrincipal;
    entityType: string;
    entityId: string;
    fieldKey: string;
    purpose: string;
    requestId?: string;
    correlationId?: string;
  }) {
    await this.prisma.dataAccessLog.create({
      data: {
        ...(input.principal.employeeId ? { employeeId: input.principal.employeeId } : {}),
        actorId: input.principal.userId,
        entityType: input.entityType,
        entityId: input.entityId,
        fieldKey: input.fieldKey,
        purpose: input.purpose,
        ...(input.requestId ? { requestId: input.requestId } : {}),
        ...(input.correlationId ? { correlationId: input.correlationId } : {}),
      },
    });
  }
}
