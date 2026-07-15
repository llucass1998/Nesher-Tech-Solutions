import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { CreateHrCaseDto, UpdateHrCaseStatusDto } from './dto/create-hr-case.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class HrCaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(input: CreateHrCaseDto, principal?: AuthenticatedPrincipal) {
    const hrCase = await this.prisma.hrCase.create({
      data: {
        ticketId: input.ticketId,
        ticketNumber: input.ticketNumber,
        requesterUserId: input.requesterUserId,
        category: input.category,
        summary: input.summary,
      },
    });

    await this.audit.record({
      principal,
      action: 'hr_case.created',
      entityType: 'HrCase',
      entityId: hrCase.id,
      after: {
        id: hrCase.id,
        ticketId: hrCase.ticketId,
        status: hrCase.status,
      },
      reason: 'Created from LogiDesk event',
    });

    return hrCase;
  }

  async updateStatus(id: string, input: UpdateHrCaseStatusDto, principal?: AuthenticatedPrincipal) {
    const existing = await this.prisma.hrCase.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('HR Case not found');
    }

    const hrCase = await this.prisma.hrCase.update({
      where: { id },
      data: { status: input.status },
    });

    await this.audit.record({
      principal,
      action: 'hr_case.status_changed',
      entityType: 'HrCase',
      entityId: hrCase.id,
      before: { status: existing.status },
      after: { status: hrCase.status },
      reason: 'Status updated by user',
    });

    await this.prisma.outboxEvent.create({
      data: {
        eventType: 'logipeople.hr_case.status_changed',
        eventVersion: 1,
        payload: JSON.parse(
          JSON.stringify({
            hrCaseId: hrCase.id,
            previousStatus: existing.status,
            newStatus: hrCase.status,
          }),
        ),
        correlationId: hrCase.ticketId,
      },
    });

    return hrCase;
  }

  async findAll() {
    return this.prisma.hrCase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string) {
    const existing = await this.prisma.hrCase.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('HR Case not found');
    }
    return existing;
  }
}
