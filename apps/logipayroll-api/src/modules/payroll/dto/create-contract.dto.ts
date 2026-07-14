import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class ContractEmployeeDto {
  @IsOptional()
  @IsUUID()
  identityUserId?: string;

  @IsOptional()
  @IsUUID()
  logiPeopleId?: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  fullName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  documentHash?: string;
}

export class CreateContractDto {
  @ValidateNested()
  @Type(() => ContractEmployeeDto)
  employee!: ContractEmployeeDto;

  @IsString()
  @IsIn(['CLT', 'PJ', 'INTERN', 'TEMPORARY'])
  type!: string;

  @IsDateString()
  startsAt!: string;

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'SUSPENDED', 'ENDED'])
  status?: string;
}
