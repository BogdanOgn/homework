import { Module } from '@nestjs/common';
import { NotificationModule } from './features/notification/notification.module.js';

@Module({
  imports: [NotificationModule],
})
export class NotificationServiceModule {}
