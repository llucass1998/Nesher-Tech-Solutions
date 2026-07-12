import { IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export enum CreatePositionStatusDto {
  OCCUPIED = 'OCCUPIED',
  VACANT = 'VACANT',
  FROZEN = 'FROZEN',
  PLANNED = 'PLANNED',
  CLOSED = 'CLOSED',
}

export class CreatePositionDto {
  @IsUUID()
  companyId!: string;

  @IsUUID()
  departmentId!: string;

  @IsOptional()
  @IsUUID()
  jobId?: string;

  @IsString()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsEnum(CreatePositionStatusDto)
  status?: CreatePositionStatusDto;
}
