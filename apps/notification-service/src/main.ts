import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module.js';
import { setupSwagger } from '@app/common';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableShutdownHooks();
  setupSwagger(app, {
    appName: 'Notification Service',
    tags: [{ name: 'Notification', description: 'Notification operations' }],
  });
  await app.listen(process.env.NOTIFICATION_SERVICE_PORT ?? 3001);
}
await bootstrap();
