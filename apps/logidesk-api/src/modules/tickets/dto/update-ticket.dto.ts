import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateTicketDto {
  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED', 'REOPENED'])
  status?: 'OPEN' | 'IN_PROGRESS' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED' | 'REOPENED';

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  teamId?: string;
}
