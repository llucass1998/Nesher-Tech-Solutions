import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Roles } from '../access-control/access-control.decorators';
import { AbacGuard } from '../access-control/abac.guard';
import { FieldAccessGuard } from '../access-control/field-access.guard';
import { RbacGuard } from '../access-control/rbac.guard';
import { AuthenticatedRequest } from '../auth/authenticated-request';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreatePerformanceReviewDto } from './dto/create-performance-review.dto';
import { PerformanceReviewService } from './performance-review.service';

@Controller('performance-reviews')
@UseGuards(JwtAuthGuard, RbacGuard, AbacGuard, FieldAccessGuard)
export class PerformanceReviewController {
  constructor(private readonly service: PerformanceReviewService) {}

  @Get()
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'AUDITOR')
  listReviews() {
    return this.service.listReviews();
  }

  @Get('employee/:employeeId')
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'HR_ANALYST', 'MANAGER', 'AUDITOR')
  listByEmployee(@Param('employeeId') employeeId: string) {
    return this.service.listByEmployee(employeeId);
  }

  @Post()
  @Roles('PEOPLE_ADMIN', 'HR_MANAGER', 'MANAGER')
  createReview(@Body() body: CreatePerformanceReviewDto, @Req() request: AuthenticatedRequest) {
    return this.service.createReview(body, request.principal);
  }
}
