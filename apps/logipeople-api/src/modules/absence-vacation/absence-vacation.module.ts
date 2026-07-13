import { Module } from '@nestjs/common';
import { AbsenceVacationController } from './absence-vacation.controller';
import { AbsenceVacationService } from './absence-vacation.service';

@Module({
  controllers: [AbsenceVacationController],
  providers: [AbsenceVacationService],
})
export class AbsenceVacationModule {}
