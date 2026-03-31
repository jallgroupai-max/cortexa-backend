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
    origin: (origin, callback) => {
      // Public widget calls come from any third-party site — allow all
      callback(null, true);
    },
    credentials: false,
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
