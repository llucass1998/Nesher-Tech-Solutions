import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, Length, Matches, MinLength } from 'class-validator';

export const benefitPlanTypes = ['HEALTH', 'DENTAL', 'MEAL', 'FOOD', 'TRANSPORT', 'LIFE_INSURANCE', 'WELLNESS', 'OTHER'] as const;

export type BenefitPlanType = (typeof benefitPlanTypes)[number];

export class CreateBenefitPlanDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  providerName!: string;

  @IsEnum(benefitPlanTypes)
  type!: BenefitPlanType;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  employerCostAmount?: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,2})?$/)
  employeeCostAmount?: string;

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
