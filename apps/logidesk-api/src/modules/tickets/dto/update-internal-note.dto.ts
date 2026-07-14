import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class UpdateInternalNoteDto {
  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsString()
  editedById?: string;

  @IsUUID()
  correlationId!: string;
}
