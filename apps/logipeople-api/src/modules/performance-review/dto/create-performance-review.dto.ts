import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class CreatePerformanceReviewDto {
  @IsUUID()
  employeeId: string;

  @IsOptional()
  @IsUUID()
  reviewerId?: string;

  @IsString()
  reviewPeriod: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  score: number;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
