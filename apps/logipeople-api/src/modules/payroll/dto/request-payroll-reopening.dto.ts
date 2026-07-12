import { IsString, IsUUID, MinLength } from 'class-validator';

export class RequestPayrollReopeningDto {
  @IsUUID()
  cycleId!: string;

  @IsString()
  @MinLength(10)
  reason!: string;
}
