import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Roles, ScopeTypes, SensitiveFields } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { FieldAccessGuard } from '../access-control/field-access.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreatePersonDto } from './dto/create-person.dto';
import { PeopleService } from './people.service';

@Controller('people')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard, FieldAccessGuard)
export class PeopleController {
  constructor(private readonly peopleService: PeopleService) {}

  @Get('persons')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'RECRUITER', 'AUDITOR', 'DPO')
  listPersons() {
    return this.peopleService.listPersons();
  }

  @Post('persons')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST')
  createPerson(@Body() body: CreatePersonDto, @Req() request: AuthenticatedRequest) {
    return this.peopleService.createPerson(body, request.principal);
  }

  @Get('employees')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'AUDITOR', 'DPO')
  listEmployees() {
    return this.peopleService.listEmployees();
  }

  @Post('employees')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST')
  @ScopeTypes('COMPANY')
  createEmployee(@Body() body: CreateEmployeeDto, @Req() request: AuthenticatedRequest) {
    return this.peopleService.createEmployee(body, request.principal);
  }

  @Get('employees/:id/timeline')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'AUDITOR', 'DPO', 'EMPLOYEE')
  @ScopeTypes('COMPANY', 'DEPARTMENT', 'TEAM', 'SUBORDINATES', 'SELF')
  @SensitiveFields('salary')
  getEmployeeTimeline(@Param('id') id: string) {
    return this.peopleService.getEmployeeTimeline(id);
  }

  @Get('employees/:id/as-of')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'AUDITOR', 'DPO', 'EMPLOYEE')
  @ScopeTypes('COMPANY', 'DEPARTMENT', 'TEAM', 'SUBORDINATES', 'SELF')
  getEmployeeAsOf(@Param('id') id: string, @Query('date') date?: string) {
    return this.peopleService.getEmployeeAsOf(id, date);
  }
}
