import { IsEnum, IsString, IsUUID, IsISO8601, IsOptional } from 'class-validator';

export class CreateLeaveRequestDto {
  @IsUUID()
  employeeId: string;

  @IsISO8601()
  startDate: string;

  @IsISO8601()
  endDate: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApproveLeaveRequestDto {
  @IsUUID()
  requestId: string;
}
