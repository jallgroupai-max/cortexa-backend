import 'dotenv/config';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { env } from './config/env';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: env.CORS_ORIGIN.includes(',')
      ? env.CORS_ORIGIN.split(',').map((o) => o.trim())
      : env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(env.PORT);
  console.log(`[SERVER] Cortexa Backend corriendo en http://localhost:${env.PORT}`);
  console.log(`[SERVER] Entorno: ${env.NODE_ENV}`);
  console.log(`[SERVER] CORS: ${env.CORS_ORIGIN}`);
}

bootstrap();
