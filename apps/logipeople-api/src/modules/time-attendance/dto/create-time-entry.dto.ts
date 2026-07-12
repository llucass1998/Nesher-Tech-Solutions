import { IsDateString, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export const timeEntryKinds = ['CLOCK_IN', 'CLOCK_OUT', 'BREAK_START', 'BREAK_END', 'ADJUSTMENT'] as const;
export const timeEntrySources = ['MANUAL', 'IMPORTED', 'MOBILE', 'WEB', 'API'] as const;

export type TimeEntryKind = (typeof timeEntryKinds)[number];
export type TimeEntrySource = (typeof timeEntrySources)[number];

export class CreateTimeEntryDto {
  @IsUUID()
  employeeId!: string;

  @IsEnum(timeEntryKinds)
  kind!: TimeEntryKind;

  @IsDateString()
  occurredAt!: string;

  @IsOptional()
  @IsEnum(timeEntrySources)
  source?: TimeEntrySource;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsString()
  @MinLength(3)
  reason!: string;
}
