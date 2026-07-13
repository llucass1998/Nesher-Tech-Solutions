import { IsDateString, IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  consentRecordedAt?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
