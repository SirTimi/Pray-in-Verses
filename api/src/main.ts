import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ Add this so all routes become /api/...
  app.setGlobalPrefix('api');

  app.use(cookieParser());
  app.enableCors({
    origin: ['http://localhost:3000'], // your frontend origin
    credentials: true,
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(process.env.PORT || 4000); // make sure this matches what you curl
}
bootstrap();
