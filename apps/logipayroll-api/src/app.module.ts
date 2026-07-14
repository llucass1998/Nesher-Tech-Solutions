import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { PayrollModule } from './modules/payroll/payroll.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule, PayrollModule],
})
export class AppModule {}
