import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Roles, ScopeTypes } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAttendancePeriodDto } from './dto/create-attendance-period.dto';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { CreateWorkScheduleDto } from './dto/create-work-schedule.dto';
import { TimeAttendanceService } from './time-attendance.service';

@Controller('time-attendance')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard)
export class TimeAttendanceController {
  constructor(private readonly timeAttendanceService: TimeAttendanceService) {}

  @Get('work-schedules')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'TIME_MANAGER', 'AUDITOR')
  listWorkSchedules() {
    return this.timeAttendanceService.listWorkSchedules();
  }

  @Post('work-schedules')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'TIME_MANAGER')
  @ScopeTypes('COMPANY')
  createWorkSchedule(@Body() body: CreateWorkScheduleDto, @Req() request: AuthenticatedRequest) {
    return this.timeAttendanceService.createWorkSchedule(body, request.principal);
  }

  @Get('entries')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'TIME_MANAGER', 'MANAGER', 'AUDITOR')
  listTimeEntries() {
    return this.timeAttendanceService.listTimeEntries();
  }

  @Post('entries')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'TIME_MANAGER')
  createTimeEntry(@Body() body: CreateTimeEntryDto, @Req() request: AuthenticatedRequest) {
    return this.timeAttendanceService.createTimeEntry(body, request.principal);
  }

  @Get('periods')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'TIME_MANAGER', 'PAYROLL_MANAGER', 'PAYROLL_ANALYST', 'AUDITOR')
  listAttendancePeriods() {
    return this.timeAttendanceService.listAttendancePeriods();
  }

  @Post('periods')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'TIME_MANAGER')
  @ScopeTypes('COMPANY')
  createAttendancePeriod(@Body() body: CreateAttendancePeriodDto, @Req() request: AuthenticatedRequest) {
    return this.timeAttendanceService.createAttendancePeriod(body, request.principal);
  }
}
