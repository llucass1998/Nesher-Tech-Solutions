import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateNotificationPreferenceDto {
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  assignmentEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  slaEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  messageEnabled?: boolean;

  @IsOptional()
  @IsString()
  actorId?: string;

  @IsOptional()
  @IsString()
  correlationId?: string;
}
