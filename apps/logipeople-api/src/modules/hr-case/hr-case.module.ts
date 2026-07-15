import { Module } from '@nestjs/common';
import { HrCaseController } from './hr-case.controller';
import { HrCaseService } from './hr-case.service';
import { AuditModule } from '../audit/audit.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [HrCaseController],
  providers: [HrCaseService],
  exports: [HrCaseService],
})
export class HrCaseModule {}
