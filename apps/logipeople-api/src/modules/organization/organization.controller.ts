import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Roles, ScopeTypes } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateCompanyDto } from './dto/create-company.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { OrganizationService } from './organization.service';

@Controller('organizations')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard)
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Get('companies')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'AUDITOR')
  listCompanies() {
    return this.organizationService.listCompanies();
  }

  @Post('companies')
  @Roles('PEOPLE_ADMIN')
  createCompany(@Body() body: CreateCompanyDto, @Req() request: AuthenticatedRequest) {
    return this.organizationService.createCompany(body, request.principal);
  }

  @Get('departments')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'AUDITOR')
  listDepartments() {
    return this.organizationService.listDepartments();
  }

  @Post('departments')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER')
  @ScopeTypes('COMPANY')
  createDepartment(@Body() body: CreateDepartmentDto, @Req() request: AuthenticatedRequest) {
    return this.organizationService.createDepartment(body, request.principal);
  }

  @Get('positions')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'AUDITOR')
  listPositions() {
    return this.organizationService.listPositions();
  }

  @Post('positions')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER')
  @ScopeTypes('COMPANY', 'DEPARTMENT')
  createPosition(@Body() body: CreatePositionDto, @Req() request: AuthenticatedRequest) {
    return this.organizationService.createPosition(body, request.principal);
  }
}
