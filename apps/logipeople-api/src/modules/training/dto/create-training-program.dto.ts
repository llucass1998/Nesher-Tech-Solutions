import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateTrainingProgramDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  mandatory?: boolean;
}
