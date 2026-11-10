import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ValidationPipe } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter, setupSwagger } from '@app/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  setupSwagger(app, {
    appName: 'User Service',
    tags: [
      { name: 'Auth', description: 'User auth operations' },
      { name: 'User', description: 'User operations' },
      { name: 'AvatarCleanup', description: 'User avatar cleanup operations' },
    ],
  });
  app.enableShutdownHooks();

  await app.listen(process.env.USER_SERVICE_PORT ?? 3000);
}
await bootstrap();
