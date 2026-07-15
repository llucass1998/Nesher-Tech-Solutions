import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { HrCaseService } from './hr-case.service';
import { CreateHrCaseDto, UpdateHrCaseStatusDto } from './dto/create-hr-case.dto';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { Roles } from '../access-control/access-control.decorators';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RbacGuard } from '../access-control/rbac.guard';

@Controller('hr-cases')
export class HrCaseController {
  constructor(private readonly hrCaseService: HrCaseService) {}

  @Post('from-logidesk')
  async createFromLogidesk(@Body() input: CreateHrCaseDto) {
    // In a real scenario, this would be protected by a service token
    // For now we assume network-level security or custom middleware handles the service token
    return this.hrCaseService.create(input);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'AUDITOR')
  async findAll() {
    return this.hrCaseService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'AUDITOR')
  async findOne(@Param('id') id: string) {
    return this.hrCaseService.findOne(id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RbacGuard)
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST')
  async updateStatus(
    @Param('id') id: string,
    @Body() input: UpdateHrCaseStatusDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.hrCaseService.updateStatus(id, input, request.principal);
  }
}

