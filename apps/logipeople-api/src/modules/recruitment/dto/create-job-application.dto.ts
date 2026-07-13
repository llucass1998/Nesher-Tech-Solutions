import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export const jobApplicationSources = ['MANUAL', 'REFERRAL', 'INTERNAL', 'JOB_BOARD', 'AGENCY', 'OTHER'] as const;

export type JobApplicationSource = (typeof jobApplicationSources)[number];

export class CreateJobApplicationDto {
  @IsUUID()
  openingId!: string;

  @IsUUID()
  candidateId!: string;

  @IsOptional()
  @IsEnum(jobApplicationSources)
  source?: JobApplicationSource;

  @IsOptional()
  @IsDateString()
  appliedAt?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
