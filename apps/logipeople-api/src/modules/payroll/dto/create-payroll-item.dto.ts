import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, Length, Matches, MinLength } from 'class-validator';

export const payrollItemTypes = ['EARNING', 'DEDUCTION', 'EMPLOYER_CHARGE', 'INFORMATIONAL'] as const;
export const payrollItemSources = ['MANUAL', 'IMPORTED', 'ATTENDANCE', 'BENEFITS', 'CONTRACT', 'ADJUSTMENT'] as const;

export type PayrollItemType = (typeof payrollItemTypes)[number];
export type PayrollItemSource = (typeof payrollItemSources)[number];

export class CreatePayrollItemDto {
  @IsUUID()
  runId!: string;

  @IsUUID()
  employeeId!: string;

  @IsEnum(payrollItemTypes)
  type!: PayrollItemType;

  @IsOptional()
  @IsEnum(payrollItemSources)
  source?: PayrollItemSource;

  @IsString()
  @MinLength(1)
  code!: string;

  @IsString()
  @MinLength(2)
  description!: string;

  @IsOptional()
  @Matches(/^\d+(\.\d{1,4})?$/)
  quantity?: string;

  @Matches(/^\d+(\.\d{1,2})?$/)
  amount!: string;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsOptional()
  @IsBoolean()
  taxable?: boolean;

  @IsString()
  @MinLength(3)
  reason!: string;
}
