import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @IsUUID()
  companyId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  code!: string;
}
