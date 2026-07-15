import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTrainingSessionDto {
  @IsUUID()
  programId: string;

  @IsOptional()
  @IsUUID()
  instructorId?: string;

  @IsDateString()
  scheduledFor: string;
}
