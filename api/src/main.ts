// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // All routes served under /api
  app.setGlobalPrefix('api');

  // Behind Nginx/Cloud proxy → let Express trust X-Forwarded-* headers
  app.set('trust proxy', 1);

  // Parse cookies (for JwtCookieAuthGuard)
  app.use(cookieParser());

  // CORS for local dev + production domains with credentials
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://prayinverses.com',
      'https://www.prayinverses.com',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie'], // allow frontend to read Set-Cookie in devtools
  });

  // DTO validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT || 4000);
}

bootstrap();
