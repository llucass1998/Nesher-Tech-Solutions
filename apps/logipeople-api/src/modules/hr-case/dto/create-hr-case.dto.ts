import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { HrCaseCategory, HrCaseStatus } from '../../../generated/prisma';

export class CreateHrCaseDto {
  @IsUUID()
  @IsNotEmpty()
  ticketId!: string;

  @IsString()
  @IsNotEmpty()
  ticketNumber!: string;

  @IsUUID()
  @IsNotEmpty()
  requesterUserId!: string;

  @IsEnum(HrCaseCategory)
  @IsNotEmpty()
  category!: HrCaseCategory;

  @IsString()
  @IsNotEmpty()
  summary!: string;

  @IsUUID()
  @IsOptional()
  correlationId?: string;
}

export class UpdateHrCaseStatusDto {
  @IsEnum(HrCaseStatus)
  @IsNotEmpty()
  status!: HrCaseStatus;
}
