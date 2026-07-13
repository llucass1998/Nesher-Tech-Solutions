import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { CreateJobOpeningDto } from './dto/create-job-opening.dto';

@Injectable()
export class RecruitmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listOpenings() {
    return this.prisma.jobOpening.findMany({
      orderBy: [{ createdAt: 'desc' }, { title: 'asc' }],
      take: 100,
      include: { company: true, position: true, _count: { select: { applications: true } } },
    });
  }

  async createOpening(input: CreateJobOpeningDto, principal?: AuthenticatedPrincipal) {
    await this.ensureCompanyExists(input.companyId);

    if (input.positionId) {
      await this.ensurePositionInCompany(input.positionId, input.companyId);
    }

    const effectiveFrom = this.parseDate(input.effectiveFrom, 'Data inicial da vaga inválida.');
    const effectiveTo = input.effectiveTo ? this.parseDate(input.effectiveTo, 'Data final da vaga inválida.') : undefined;

    if (effectiveTo && effectiveTo < effectiveFrom) {
      throw new BadRequestException({ error: 'Data final da vaga não pode ser anterior à data inicial.' });
    }

    const opening = await this.prisma.jobOpening.create({
      data: {
        companyId: input.companyId,
        ...(input.positionId ? { positionId: input.positionId } : {}),
        title: input.title,
        description: input.description,
        targetOpenings: input.targetOpenings ?? 1,
        effectiveFrom,
        ...(effectiveTo ? { effectiveTo } : {}),
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'recruitment.opening.created',
      entityType: 'JobOpening',
      entityId: opening.id,
      after: {
        id: opening.id,
        companyId: opening.companyId,
        positionId: opening.positionId,
        status: opening.status,
        legalValidationPending: opening.legalValidationPending,
      },
      reason: 'Recruitment opening created through LogiPeople API',
    });

    return opening;
  }

  listCandidates() {
    return this.prisma.candidate.findMany({
      orderBy: [{ createdAt: 'desc' }, { fullName: 'asc' }],
      take: 100,
      include: { _count: { select: { applications: true } } },
    });
  }

  async createCandidate(input: CreateCandidateDto, principal?: AuthenticatedPrincipal) {
    const candidate = await this.prisma.candidate.create({
      data: {
        fullName: input.fullName,
        email: input.email,
        ...(input.phone ? { phone: input.phone } : {}),
        ...(input.consentRecordedAt ? { consentRecordedAt: this.parseDate(input.consentRecordedAt, 'Data de consentimento inválida.') } : {}),
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
        source: 'logipeople-api',
      },
    });

    await this.audit.record({
      principal,
      action: 'recruitment.candidate.created',
      entityType: 'Candidate',
      entityId: candidate.id,
      after: {
        id: candidate.id,
        status: candidate.status,
        dataClassification: candidate.dataClassification,
      },
      reason: 'Candidate created through LogiPeople API',
    });

    return candidate;
  }

  listApplications() {
    return this.prisma.jobApplication.findMany({
      orderBy: [{ appliedAt: 'desc' }, { createdAt: 'desc' }],
      take: 100,
      include: { opening: { include: { company: true, position: true } }, candidate: true },
    });
  }

  async createApplication(input: CreateJobApplicationDto, principal?: AuthenticatedPrincipal) {
    const opening = await this.ensureOpeningExists(input.openingId);
    await this.ensureCandidateExists(input.candidateId);

    if (opening.status === 'CLOSED' || opening.status === 'CANCELLED') {
      throw new BadRequestException({ error: 'Vaga encerrada ou cancelada não pode receber novas candidaturas.' });
    }

    const application = await this.prisma.jobApplication.create({
      data: {
        openingId: input.openingId,
        candidateId: input.candidateId,
        source: input.source ?? 'MANUAL',
        ...(input.appliedAt ? { appliedAt: this.parseDate(input.appliedAt, 'Data da candidatura inválida.') } : {}),
        ...(input.notes ? { notes: input.notes } : {}),
        recordedBy: principal?.userId ?? 'system',
        reason: input.reason,
      },
    });

    await this.audit.record({
      principal,
      action: 'recruitment.application.created',
      entityType: 'JobApplication',
      entityId: application.id,
      after: {
        id: application.id,
        openingId: application.openingId,
        candidateId: application.candidateId,
        status: application.status,
        source: application.source,
        legalValidationPending: application.legalValidationPending,
      },
      reason: 'Job application created through LogiPeople API',
    });

    return application;
  }

  private async ensureCompanyExists(companyId: string) {
    const company = await this.prisma.company.findUnique({ where: { id: companyId } });

    if (!company) {
      throw new NotFoundException({ error: 'Empresa não encontrada.' });
    }

    return company;
  }

  private async ensurePositionInCompany(positionId: string, companyId: string) {
    const position = await this.prisma.position.findUnique({ where: { id: positionId } });

    if (!position) {
      throw new NotFoundException({ error: 'Posição não encontrada.' });
    }

    if (position.companyId !== companyId) {
      throw new BadRequestException({ error: 'Posição não pertence à empresa informada.' });
    }

    return position;
  }

  private async ensureCandidateExists(candidateId: string) {
    const candidate = await this.prisma.candidate.findUnique({ where: { id: candidateId } });

    if (!candidate) {
      throw new NotFoundException({ error: 'Candidato não encontrado.' });
    }

    return candidate;
  }

  private async ensureOpeningExists(openingId: string) {
    const opening = await this.prisma.jobOpening.findUnique({ where: { id: openingId } });

    if (!opening) {
      throw new NotFoundException({ error: 'Vaga não encontrada.' });
    }

    return opening;
  }

  private parseDate(value: string, message: string) {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException({ error: message });
    }

    return parsed;
  }
}
