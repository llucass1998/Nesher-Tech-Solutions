import { IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class ChangeTicketStatusDto {
  @IsIn(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_INTERNAL', 'RESOLVED', 'CLOSED', 'CANCELED'])
  status!: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'WAITING_INTERNAL' | 'RESOLVED' | 'CLOSED' | 'CANCELED';

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
