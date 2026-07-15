import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateEnrollmentDto {
  @IsOptional()
  @IsString()
  status?: 'ENROLLED' | 'ATTENDED' | 'ABSENT' | 'FAILED';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  score?: number;
}
