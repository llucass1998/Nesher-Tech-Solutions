import { IsOptional, IsString, IsUUID, Length, Matches, MinLength } from 'class-validator';

export class CreatePayrollRunDto {
  @IsUUID()
  cycleId!: string;

  @IsUUID()
  companyId!: string;

  @IsUUID()
  employeeId!: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  grossAmount?: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  deductionAmount?: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  netAmount?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
