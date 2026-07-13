import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateTicketFromLogiflowDto {
  @IsUUID()
  deliveryId!: string;

  @IsUUID()
  occurrenceId!: string;

  @IsString()
  @MinLength(3)
  subject!: string;

  @IsString()
  @MinLength(3)
  description!: string;

  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority!: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

  @IsOptional()
  @IsEmail()
  requesterEmail?: string;

  @IsUUID()
  correlationId!: string;
}
