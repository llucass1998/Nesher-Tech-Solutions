import { IsBoolean, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateMessageDto {
  @IsOptional()
  @IsString()
  authorId?: string;

  @IsString()
  authorRole!: string;

  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsBoolean()
  internal?: boolean;

  @IsUUID()
  correlationId!: string;
}
