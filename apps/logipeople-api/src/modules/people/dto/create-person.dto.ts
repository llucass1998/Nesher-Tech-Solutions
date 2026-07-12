import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export enum DataClassificationDto {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  CONFIDENTIAL = 'CONFIDENTIAL',
  SENSITIVE = 'SENSITIVE',
  RESTRICTED = 'RESTRICTED',
}

export class CreatePersonDto {
  @IsString()
  @MinLength(2)
  fullName!: string;

  @IsOptional()
  @IsString()
  preferredName?: string;

  @IsEmail()
  corporateEmail!: string;

  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(DataClassificationDto)
  dataClassification?: DataClassificationDto;
}
