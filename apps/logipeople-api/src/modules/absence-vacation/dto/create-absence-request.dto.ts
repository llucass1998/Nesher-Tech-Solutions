import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export const absenceRequestTypes = ['SICK_LEAVE', 'PERSONAL_LEAVE', 'UNPAID_LEAVE', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'OTHER'] as const;

export type AbsenceRequestType = (typeof absenceRequestTypes)[number];

export class CreateAbsenceRequestDto {
  @IsUUID()
  companyId!: string;

  @IsUUID()
  employeeId!: string;

  @IsEnum(absenceRequestTypes)
  type!: AbsenceRequestType;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalDays!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
