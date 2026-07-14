import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
