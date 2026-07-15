import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';

@Injectable()
export class PerformanceReviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listReviews() {
    return this.prisma.performanceReview.findMany({
      orderBy: [{ createdAt: 'desc' }],
      take: 100,
      include: { employee: true, reviewer: true },
    });
  }

  async listByEmployee(employeeId: string) {
    await this.ensureEmployeeExists(employeeId);

    return this.prisma.performanceReview.findMany({
      where: { employeeId },
      orderBy: [{ createdAt: 'desc' }],
      include: { reviewer: true },
    });
  }

  async createReview(input: CreatePerformanceReviewDto, principal?: AuthenticatedPrincipal) {
    await this.ensureEmployeeExists(input.employeeId);

    if (input.reviewerId) {
      await this.ensureEmployeeExists(input.reviewerId);
    }

    const review = await this.prisma.performanceReview.create({
      data: {
        employeeId: input.employeeId,
        reviewerId: input.reviewerId ?? null,
        reviewPeriod: input.reviewPeriod,
        score: input.score,
        comments: input.comments ?? null,
        status: 'DRAFT',
      },
      include: { employee: true, reviewer: true },
    });

    await this.audit.record({
      principal,
      action: 'performance_review.created',
      entityType: 'PerformanceReview',
      entityId: review.id,
      after: {
        id: review.id,
        employeeId: review.employeeId,
        reviewerId: review.reviewerId,
        score: review.score,
        status: review.status,
      },
      reason: input.reason ?? 'Performance review created through LogiPeople API',
    });

    return review;
  }

  private async ensureEmployeeExists(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });

    if (!employee) {
      throw new NotFoundException({ error: 'Colaborador nao encontrado.' });
    }

    return employee;
  }
}
