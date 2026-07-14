import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { PayrollModule } from './modules/payroll/payroll.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), AuthModule, HealthModule, PayrollModule],
})
export class AppModule {}
