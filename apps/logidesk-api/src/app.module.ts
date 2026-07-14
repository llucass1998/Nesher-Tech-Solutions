import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './modules/health/health.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({
  imports: [PrismaModule, HealthModule, TicketsModule, AuthModule],
})
export class AppModule {}
