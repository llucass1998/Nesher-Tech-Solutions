import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class CreateWorkScheduleDto {
  @IsUUID()
  companyId!: string;

  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  weeklyMinutes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(7)
  workDays!: number;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
