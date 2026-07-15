import { Injectable, NotFoundException } from '@nestjs/common';
import { AuthenticatedPrincipal } from '@logipeople/auth';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTrainingProgramDto } from './dto/create-training-program.dto';
import { CreateTrainingSessionDto } from './dto/create-training-session.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';

@Injectable()
export class TrainingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Programs
  listPrograms() {
    return this.prisma.trainingProgram.findMany({
      orderBy: [{ createdAt: 'desc' }],
    });
  }

  async createProgram(input: CreateTrainingProgramDto, principal?: AuthenticatedPrincipal) {
    const program = await this.prisma.trainingProgram.create({
      data: {
        title: input.title,
        description: input.description ?? null,
        mandatory: input.mandatory ?? false,
      },
    });

    await this.audit.record({
      principal,
      action: 'training_program.created',
      entityType: 'TrainingProgram',
      entityId: program.id,
      after: {
        id: program.id,
        title: program.title,
      },
      reason: 'Training program created through API',
    });

    return program;
  }

  // Sessions
  listSessions() {
    return this.prisma.trainingSession.findMany({
      orderBy: [{ scheduledFor: 'desc' }],
      include: { program: true, instructor: true, _count: { select: { enrollments: true } } },
    });
  }

  async createSession(input: CreateTrainingSessionDto, principal?: AuthenticatedPrincipal) {
    const program = await this.prisma.trainingProgram.findUnique({ where: { id: input.programId } });
    if (!program) throw new NotFoundException('Programa nao encontrado');

    if (input.instructorId) {
      const instructor = await this.prisma.employee.findUnique({ where: { id: input.instructorId } });
      if (!instructor) throw new NotFoundException('Instrutor nao encontrado');
    }

    const session = await this.prisma.trainingSession.create({
      data: {
        programId: input.programId,
        instructorId: input.instructorId ?? null,
        scheduledFor: new Date(input.scheduledFor),
        status: 'SCHEDULED',
      },
      include: { program: true },
    });

    await this.audit.record({
      principal,
      action: 'training_session.created',
      entityType: 'TrainingSession',
      entityId: session.id,
      after: {
        id: session.id,
        programId: session.programId,
        scheduledFor: session.scheduledFor,
      },
      reason: 'Training session created through API',
    });

    return session;
  }

  // Enrollments
  async enroll(sessionId: string, employeeId: string, principal?: AuthenticatedPrincipal) {
    const session = await this.prisma.trainingSession.findUnique({ where: { id: sessionId } });
    if (!session) throw new NotFoundException('Turma nao encontrada');

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Colaborador nao encontrado');

    const enrollment = await this.prisma.trainingEnrollment.create({
      data: {
        sessionId,
        employeeId,
        status: 'ENROLLED',
      },
      include: { session: { include: { program: true } }, employee: true },
    });

    await this.audit.record({
      principal,
      action: 'training_enrollment.created',
      entityType: 'TrainingEnrollment',
      entityId: enrollment.id,
      after: {
        id: enrollment.id,
        sessionId: enrollment.sessionId,
        employeeId: enrollment.employeeId,
      },
      reason: 'Employee enrolled in training session',
    });

    return enrollment;
  }

  async updateEnrollment(enrollmentId: string, input: UpdateEnrollmentDto, principal?: AuthenticatedPrincipal) {
    const existing = await this.prisma.trainingEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!existing) throw new NotFoundException('Inscricao nao encontrada');

    const enrollment = await this.prisma.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        ...(input.status !== undefined && { status: input.status }),
        ...(input.score !== undefined && { score: input.score }),
      },
      include: { session: true, employee: true },
    });

    await this.audit.record({
      principal,
      action: 'training_enrollment.updated',
      entityType: 'TrainingEnrollment',
      entityId: enrollment.id,
      before: {
        status: existing.status,
        score: existing.score,
      },
      after: {
        status: enrollment.status,
        score: enrollment.score,
      },
      reason: 'Enrollment updated through API',
    });

    return enrollment;
  }
}
