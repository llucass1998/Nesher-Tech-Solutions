import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  subject!: string;

  @IsString()
  @MinLength(3)
  description!: string;

  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @IsOptional()
  @IsIn(['LOGIDESK', 'EMAIL', 'API'])
  source?: 'LOGIDESK' | 'EMAIL' | 'API';

  @IsOptional()
  @IsString()
  requesterId?: string;

  @IsOptional()
  @IsString()
  requesterName?: string;

  @IsOptional()
  @IsEmail()
  requesterEmail?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsUUID(undefined, { each: true })
  tagIds?: string[];

  @IsUUID()
  correlationId!: string;

  @IsOptional()
  @IsString()
  actorId?: string;
}
