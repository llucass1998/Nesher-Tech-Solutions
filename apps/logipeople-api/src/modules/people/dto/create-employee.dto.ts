import { IsDateString, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateEmployeeDto {
  @IsUUID()
  personId!: string;

  @IsUUID()
  companyId!: string;

  @IsOptional()
  @IsUUID()
  positionId?: string;

  @IsString()
  @MinLength(1)
  employeeNumber!: string;

  @IsDateString()
  hireDate!: string;
}
