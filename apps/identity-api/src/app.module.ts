import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { DirectoryModule } from './modules/directory/directory.module';

@Module({
  imports: [PrismaModule, HealthModule, AuthModule, DirectoryModule],
})
export class AppModule {}
