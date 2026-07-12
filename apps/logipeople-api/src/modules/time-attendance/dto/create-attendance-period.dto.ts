import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class CreateAttendancePeriodDto {
  @IsUUID()
  companyId!: string;

  @IsUUID()
  employeeId!: string;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  plannedMinutes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  workedMinutes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  absenceMinutes!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  extraMinutes!: number;

  @IsString()
  @MinLength(3)
  reason!: string;
}
