// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import * as express from 'express';           // ✅ use express middlewares
import * as bodyParser from 'body-parser';    // ✅ for json/urlencoded with verify

function parseOrigins(): (string | RegExp)[] {
  const raw =
    process.env.CORS_ORIGINS ??
    'https://prayinverses.com,http://localhost:3000';
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure Express trusts proxy headers from Nginx so req.protocol / x-forwarded-* work
  app.set('trust proxy', 1);

  // Stable API prefix
  app.setGlobalPrefix('api');

  // ------ Webhook raw body FIRST (no JSON parsing here) ------
  // This ensures Paystack signature is computed on the exact raw body.
  app.use('/api/donations/webhooks/paystack', express.raw({ type: '*/*' }));

  // ------ Normal body parsers (will set req.rawBody for convenience) ------
  app.use(
    bodyParser.json({
      limit: '1mb',
      verify: (req: any, _res, buf) => {
        if (buf?.length) req.rawBody = buf.toString();
      },
    }),
  );
  app.use(
    bodyParser.urlencoded({
      extended: true,
      limit: '1mb',
      verify: (req: any, _res, buf) => {
        if (buf?.length) req.rawBody = buf.toString();
      },
    }),
  );

  // Cookies (httpOnly JWT lives in 'access_token')
  app.use(cookieParser());

  // CORS allowlist (extend via CORS_ORIGINS env)
  const origins = parseOrigins();
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-paystack-signature', // harmless here; webhook isn’t browser CORS
    ],
  });

  // Global validation
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // Graceful shutdowns
  app.enableShutdownHooks();

  await app.listen(process.env.PORT || 4000, '0.0.0.0');
}
bootstrap();
