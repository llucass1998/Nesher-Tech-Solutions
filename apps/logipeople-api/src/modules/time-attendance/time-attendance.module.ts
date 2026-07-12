import { Module } from '@nestjs/common';
import { TimeAttendanceController } from './time-attendance.controller';
import { TimeAttendanceService } from './time-attendance.service';

@Module({
  controllers: [TimeAttendanceController],
  providers: [TimeAttendanceService],
})
export class TimeAttendanceModule {}
