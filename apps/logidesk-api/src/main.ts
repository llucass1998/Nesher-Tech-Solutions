import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { IdentityJwksService } from './modules/auth/identity-jwks.service';
import { RealtimeService } from './modules/realtime/realtime.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet());
  app.enableCors({
    origin: process.env.LOGIDESK_WEB_ORIGIN ?? 'http://localhost:3500',
    credentials: true,
  });
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.get(RealtimeService).attach(
    app.getHttpServer(),
    app.get(IdentityJwksService),
    process.env.LOGIDESK_WEB_ORIGIN ?? 'http://localhost:3500',
  );

  await app.listen(Number(process.env.LOGIDESK_PORT ?? 3533));
}

bootstrap();
