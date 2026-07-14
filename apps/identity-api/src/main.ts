import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.use(helmet());
  app.enableCors({
    origin: identityCorsOrigins(),
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(Number(process.env.IDENTITY_PORT ?? 3633));
}

bootstrap();

function identityCorsOrigins() {
  const configured = process.env.IDENTITY_WEB_ORIGIN;

  if (!configured) {
    return true;
  }

  const origins = configured.split(',').map((origin) => origin.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}
