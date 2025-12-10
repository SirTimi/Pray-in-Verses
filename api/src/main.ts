// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';

function parseOrigins(): (string | RegExp)[] {
  const raw = process.env.CORS_ORIGINS
    ?? 'https://prayinverses.com,http://localhost:3000';
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // if you log bodies elsewhere, keep this false
    // logger: ['error', 'warn', 'log'],
  });

  // Ensure Express trusts proxy headers from Nginx so req.protocol / x-forwarded-* work
  app.set('trust proxy', 1);

  // Keep a stable API prefix
  app.setGlobalPrefix('api');

  // Attach raw body for webhook signature verification (e.g., Paystack)
  app.use(bodyParser.json({
    verify: (req: any, _res, buf) => { req.rawBody = buf.toString(); },
    limit: '1mb',
  }));
  app.use(bodyParser.urlencoded({
    extended: true,
    verify: (req: any, _res, buf) => { req.rawBody = buf.toString(); },
    limit: '1mb',
  }));

  // Cookies (httpOnly JWT lives in 'access_token')
  app.use(cookieParser());

  // CORS (strict allowlist). Add more origins via CORS_ORIGINS env (comma-separated)
  const origins = parseOrigins();
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Graceful shutdowns in prod environments
  app.enableShutdownHooks();

  await app.listen(process.env.PORT || 4000, '0.0.0.0');
}
bootstrap();
