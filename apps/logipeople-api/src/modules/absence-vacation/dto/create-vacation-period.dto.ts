import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateVacationPeriodDto {
  @IsUUID()
  companyId!: string;

  @IsUUID()
  employeeId!: string;

  @IsDateString()
  accrualStart!: string;

  @IsDateString()
  accrualEnd!: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  days!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
