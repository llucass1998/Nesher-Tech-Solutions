import { IsString, IsUUID, MinLength } from 'class-validator';

export class CreatePayslipDto {
  @IsUUID()
  payrollRunId!: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
