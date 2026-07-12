import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsString, IsUUID, Max, Min, MinLength } from 'class-validator';

export class CreatePayrollCycleDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  referenceMonth!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  referenceYear!: number;

  @IsDateString()
  periodStart!: string;

  @IsDateString()
  periodEnd!: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
