import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateHrCaseStatusFromLogipeopleDto {
  @IsEnum(['OPEN', 'IN_REVIEW', 'WAITING_EMPLOYEE', 'WAITING_MANAGER', 'COMPLETED', 'CANCELED'])
  @IsNotEmpty()
  newStatus!: string;

  @IsEnum(['OPEN', 'IN_REVIEW', 'WAITING_EMPLOYEE', 'WAITING_MANAGER', 'COMPLETED', 'CANCELED'])
  @IsNotEmpty()
  previousStatus!: string;
}
