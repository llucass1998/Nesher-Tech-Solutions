import { IsInt, IsOptional, IsString, IsUUID, IsUrl, Max, Min, MinLength } from 'class-validator';

export class CreateAttachmentDto {
  @IsString()
  @MinLength(1)
  fileName!: string;

  @IsString()
  @MinLength(3)
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(25 * 1024 * 1024)
  sizeBytes!: number;

  @IsUrl({ require_tld: false })
  url!: string;

  @IsOptional()
  @IsString()
  storageKey?: string;

  @IsOptional()
  @IsString()
  uploadedById?: string;

  @IsUUID()
  correlationId!: string;
}
