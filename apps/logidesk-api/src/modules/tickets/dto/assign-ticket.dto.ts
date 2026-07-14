import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class AssignTicketDto {
  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  assignedById?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  reason?: string;

  @IsUUID()
  correlationId!: string;
}
