import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { FieldAccessGuard } from '../access-control/field-access.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateTrainingProgramDto } from './dto/create-training-program.dto';
import { CreateTrainingSessionDto } from './dto/create-training-session.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { TrainingService } from './training.service';

@Controller('trainings')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard, FieldAccessGuard)
export class TrainingController {
  constructor(private readonly service: TrainingService) {}

  @Get('programs')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'AUDITOR')
  listPrograms() {
    return this.service.listPrograms();
  }

  @Post('programs')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER')
  createProgram(@Body() body: CreateTrainingProgramDto, @Req() request: AuthenticatedRequest) {
    return this.service.createProgram(body, request.principal);
  }

  @Get('sessions')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'AUDITOR')
  listSessions() {
    return this.service.listSessions();
  }

  @Post('sessions')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST')
  createSession(@Body() body: CreateTrainingSessionDto, @Req() request: AuthenticatedRequest) {
    return this.service.createSession(body, request.principal);
  }

  @Post('sessions/:sessionId/enroll')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER')
  enroll(@Param('sessionId') sessionId: string, @Body('employeeId') employeeId: string, @Req() request: AuthenticatedRequest) {
    return this.service.enroll(sessionId, employeeId, request.principal);
  }

  @Patch('enrollments/:enrollmentId')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER')
  updateEnrollment(@Param('enrollmentId') enrollmentId: string, @Body() body: UpdateEnrollmentDto, @Req() request: AuthenticatedRequest) {
    return this.service.updateEnrollment(enrollmentId, body, request.principal);
  }
}
