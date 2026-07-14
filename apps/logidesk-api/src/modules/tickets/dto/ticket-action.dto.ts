import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class TicketActionDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;

  @IsUUID()
  correlationId!: string;

  @IsOptional()
  @IsString()
  actorId?: string;
}
