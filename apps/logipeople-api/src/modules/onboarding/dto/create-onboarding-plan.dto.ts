import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateOnboardingPlanDto {
  @IsUUID()
  companyId!: string;

  @IsUUID()
  employeeId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  targetEndDate?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
