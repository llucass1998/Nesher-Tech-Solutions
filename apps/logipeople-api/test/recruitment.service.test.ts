import { BadRequestException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { describe, expect, it, vi } from 'vitest';
import { RecruitmentService } from '../src/modules/recruitment/recruitment.service';

function createRecruitmentService() {
  const companyFindUnique = vi.fn().mockResolvedValue({ id: 'company-1' });
  const positionFindUnique = vi.fn().mockResolvedValue({ id: 'position-1', companyId: 'company-1' });
  const jobOpeningFindUnique = vi.fn().mockResolvedValue({ id: 'opening-1', status: 'OPEN' });
  const candidateFindUnique = vi.fn().mockResolvedValue({ id: 'candidate-1', status: 'ACTIVE' });
  const jobOpeningCreate = vi.fn().mockResolvedValue({
    id: 'opening-1',
    companyId: 'company-1',
    positionId: 'position-1',
    status: 'DRAFT',
    legalValidationPending: true,
  });
  const candidateCreate = vi.fn().mockResolvedValue({
    id: 'candidate-1',
    status: 'NEW',
    dataClassification: 'CONFIDENTIAL',
  });
  const jobApplicationCreate = vi.fn().mockResolvedValue({
    id: 'application-1',
    openingId: 'opening-1',
    candidateId: 'candidate-1',
    status: 'APPLIED',
    source: 'MANUAL',
    legalValidationPending: true,
  });

  const prisma = {
    company: {
      findUnique: companyFindUnique,
    },
    position: {
      findUnique: positionFindUnique,
    },
    jobOpening: {
      findMany: vi.fn(),
      findUnique: jobOpeningFindUnique,
      create: jobOpeningCreate,
    },
    candidate: {
      findMany: vi.fn(),
      findUnique: candidateFindUnique,
      create: candidateCreate,
    },
    jobApplication: {
      findMany: vi.fn(),
      create: jobApplicationCreate,
    },
  };

  const audit = {
    record: vi.fn().mockResolvedValue(undefined),
  };

  return {
    service: new RecruitmentService(prisma as never, audit as never),
    audit,
    companyFindUnique,
    positionFindUnique,
    jobOpeningFindUnique,
    candidateFindUnique,
    jobOpeningCreate,
    candidateCreate,
    jobApplicationCreate,
  };
}

const principal: AuthenticatedPrincipal = {
  userId: 'user-1',
  roles: ['RECRUITER'],
  scopes: [{ type: 'COMPANY', id: 'company-1' }],
};

describe('RecruitmentService', () => {
  it('creates a preliminary job opening with legal validation pending', async () => {
    const context = createRecruitmentService();

    await expect(
      context.service.createOpening(
        {
          companyId: 'company-1',
          positionId: 'position-1',
          title: 'Analista de RH',
          description: 'Vaga preliminar para triagem interna',
          targetOpenings: 1,
          effectiveFrom: '2026-08-01',
          reason: 'Initial recruitment setup',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'opening-1', legalValidationPending: true });

    expect(context.companyFindUnique).toHaveBeenCalledWith({ where: { id: 'company-1' } });
    expect(context.positionFindUnique).toHaveBeenCalledWith({ where: { id: 'position-1' } });
    expect(context.jobOpeningCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          companyId: 'company-1',
          positionId: 'position-1',
          title: 'Analista de RH',
          recordedBy: 'user-1',
          source: 'logipeople-api',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'recruitment.opening.created',
        entityType: 'JobOpening',
        entityId: 'opening-1',
      }),
    );
  });

  it('creates a preliminary candidate without onboarding or hiring', async () => {
    const context = createRecruitmentService();

    await expect(
      context.service.createCandidate(
        {
          fullName: 'Candidato Demo',
          email: 'candidate@example.com',
          phone: '+5511999999999',
          consentRecordedAt: '2026-08-01T10:00:00.000Z',
          reason: 'Candidate prospect registration',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'candidate-1', dataClassification: 'CONFIDENTIAL' });

    expect(context.candidateCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fullName: 'Candidato Demo',
          email: 'candidate@example.com',
          recordedBy: 'user-1',
          source: 'logipeople-api',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'recruitment.candidate.created',
        entityType: 'Candidate',
        entityId: 'candidate-1',
      }),
    );
  });

  it('creates a preliminary application without creating an employee record', async () => {
    const context = createRecruitmentService();

    await expect(
      context.service.createApplication(
        {
          openingId: 'opening-1',
          candidateId: 'candidate-1',
          source: 'REFERRAL',
          appliedAt: '2026-08-02T10:00:00.000Z',
          notes: 'Indicação interna preliminar',
          reason: 'Candidate application registration',
        },
        principal,
      ),
    ).resolves.toMatchObject({ id: 'application-1', legalValidationPending: true });

    expect(context.jobOpeningFindUnique).toHaveBeenCalledWith({ where: { id: 'opening-1' } });
    expect(context.candidateFindUnique).toHaveBeenCalledWith({ where: { id: 'candidate-1' } });
    expect(context.jobApplicationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          openingId: 'opening-1',
          candidateId: 'candidate-1',
          source: 'REFERRAL',
          recordedBy: 'user-1',
        }),
      }),
    );
    expect(context.audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'recruitment.application.created',
        entityType: 'JobApplication',
        entityId: 'application-1',
      }),
    );
  });

  it('rejects openings with inverted effective dates', async () => {
    const context = createRecruitmentService();

    await expect(
      context.service.createOpening({
        companyId: 'company-1',
        title: 'Vaga inválida',
        description: 'Vaga com datas invertidas',
        effectiveFrom: '2026-09-01',
        effectiveTo: '2026-08-01',
        reason: 'Invalid recruitment opening',
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects applications for closed openings', async () => {
    const context = createRecruitmentService();
    context.jobOpeningFindUnique.mockResolvedValue({ id: 'opening-1', status: 'CLOSED' });

    await expect(
      context.service.createApplication({
        openingId: 'opening-1',
        candidateId: 'candidate-1',
        source: 'MANUAL',
        reason: 'Invalid closed opening application',
      }),
    ).rejects.toThrow(BadRequestException);
  });
});
