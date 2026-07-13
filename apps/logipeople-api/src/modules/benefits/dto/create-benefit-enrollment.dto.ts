import { IsDateString, IsOptional, IsString, IsUUID, Length, Matches, MinLength } from 'class-validator';

export class CreateBenefitEnrollmentDto {
  @IsUUID()
  companyId!: string;

  @IsUUID()
  planId!: string;

  @IsUUID()
  employeeId!: string;

  @IsString()
  @MinLength(2)
  coverageLevel!: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  employeeCostAmount?: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  employerCostAmount?: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsDateString()
  effectiveFrom!: string;

  @IsOptional()
  @IsDateString()
  effectiveTo?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
