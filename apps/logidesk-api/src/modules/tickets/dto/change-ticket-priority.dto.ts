import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class ChangeTicketPriorityDto {
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority!: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

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
