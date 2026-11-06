import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { NotificationServiceModule } from './notification-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(NotificationServiceModule);

  app.enableShutdownHooks();

  await app.listen(process.env.NOTIFICATION_SERVICE_PORT ?? 3001);
}
await bootstrap();
