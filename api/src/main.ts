// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import * as express from 'express';
import * as bodyParser from 'body-parser';

function parseOrigins(): (string | RegExp)[] {
  const raw =
    process.env.CORS_ORIGINS ??
    'https://prayinverses.com, http://localhost:3000, https://www.prayinverses.com';

  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function resolvePort() {
  const raw = process.env.PORT ?? '4000';
  const port = Number(raw);

  if (
    !Number.isInteger(port) ||
    port <= 0 ||
    port > 65_535
  ) {
    throw new Error(
      `Invalid PORT environment variable: ${raw}`,
    );
  }

  return port;
}

async function bootstrap() {
  const app =
    await NestFactory.create<NestExpressApplication>(
      AppModule,
    );

  // Ensure Express trusts proxy headers from Cloud Run / Nginx so
  // req.protocol and x-forwarded-* values are interpreted correctly.
  app.set('trust proxy', 1);

  // Stable API prefix
  app.setGlobalPrefix('api');

  // Webhook raw body FIRST (no JSON parsing here). This ensures the
  // Paystack signature is computed on the exact raw request body.
  app.use(
    '/api/donations/webhooks/paystack',
    express.raw({ type: '*/*' }),
  );

  // Normal body parsers. Keep rawBody available for integrations that
  // need the original payload while preserving the existing API behavior.
  app.use(
    bodyParser.json({
      limit: '1mb',
      verify: (req: any, _res, buf) => {
        if (buf?.length) {
          req.rawBody = buf.toString();
        }
      },
    }),
  );

  app.use(
    bodyParser.urlencoded({
      extended: true,
      limit: '1mb',
      verify: (req: any, _res, buf) => {
        if (buf?.length) {
          req.rawBody = buf.toString();
        }
      },
    }),
  );

  // Cookies (HTTP-only JWT lives in access_token)
  app.use(cookieParser());

  // CORS allowlist (extend via CORS_ORIGINS env)
  const origins = parseOrigins();
  app.enableCors({
    origin: origins,
    credentials: true,
    methods: [
      'GET',
      'POST',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'x-paystack-signature',
    ],
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Graceful shutdowns
  app.enableShutdownHooks();

  const port = resolvePort();

  await app.listen(
    port,
    '0.0.0.0',
  );

  console.log(
    `Pray in Verses API listening on 0.0.0.0:${port}`,
  );
}

void bootstrap().catch((error: unknown) => {
  console.error(
    'Pray in Verses API failed to start:',
    error,
  );
  process.exit(1);
});
