import { IsOptional, IsString, MinLength } from 'class-validator';

export class ReprocessDeadLetterDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;

  @IsOptional()
  @IsString()
  actorId?: string;
}
