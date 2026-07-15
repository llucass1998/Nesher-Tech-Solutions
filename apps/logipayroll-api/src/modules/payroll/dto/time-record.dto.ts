import { IsEnum, IsString, IsUUID, IsISO8601 } from 'class-validator';

export class CreateTimeRecordDto {
  @IsUUID()
  employeeId: string;

  @IsEnum(['CLOCK_IN', 'CLOCK_OUT'])
  kind: 'CLOCK_IN' | 'CLOCK_OUT';

  @IsISO8601()
  timestamp: string;
}
