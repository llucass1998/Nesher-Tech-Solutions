import { IsString, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  legalName!: string;

  @IsString()
  @MinLength(3)
  registrationNumber!: string;
}
