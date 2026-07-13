import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export const onboardingTaskOwners = ['HR', 'MANAGER', 'EMPLOYEE', 'IT', 'FACILITIES', 'OTHER'] as const;

export type OnboardingTaskOwner = (typeof onboardingTaskOwners)[number];

export class CreateOnboardingTaskDto {
  @IsUUID()
  planId!: string;

  @IsUUID()
  employeeId!: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(onboardingTaskOwners)
  owner?: OnboardingTaskOwner;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
