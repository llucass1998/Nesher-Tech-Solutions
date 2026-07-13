import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Roles, ScopeTypes, SensitiveFields } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { FieldAccessGuard } from '../access-control/field-access.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCandidateDto } from './dto/create-candidate.dto';
import { CreateJobApplicationDto } from './dto/create-job-application.dto';
import { CreateJobOpeningDto } from './dto/create-job-opening.dto';
import { RecruitmentService } from './recruitment.service';

@Controller('recruitment')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard, FieldAccessGuard)
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get('openings')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'RECRUITER', 'MANAGER', 'AUDITOR')
  listOpenings() {
    return this.recruitmentService.listOpenings();
  }

  @Post('openings')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'RECRUITER')
  @ScopeTypes('COMPANY')
  createOpening(@Body() body: CreateJobOpeningDto, @Req() request: AuthenticatedRequest) {
    return this.recruitmentService.createOpening(body, request.principal);
  }

  @Get('candidates')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'RECRUITER', 'AUDITOR')
  @SensitiveFields('documents')
  listCandidates() {
    return this.recruitmentService.listCandidates();
  }

  @Post('candidates')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'RECRUITER')
  @SensitiveFields('documents')
  createCandidate(@Body() body: CreateCandidateDto, @Req() request: AuthenticatedRequest) {
    return this.recruitmentService.createCandidate(body, request.principal);
  }

  @Get('applications')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'RECRUITER', 'MANAGER', 'AUDITOR')
  @SensitiveFields('documents')
  listApplications() {
    return this.recruitmentService.listApplications();
  }

  @Post('applications')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'RECRUITER')
  @SensitiveFields('documents')
  createApplication(@Body() body: CreateJobApplicationDto, @Req() request: AuthenticatedRequest) {
    return this.recruitmentService.createApplication(body, request.principal);
  }
}
