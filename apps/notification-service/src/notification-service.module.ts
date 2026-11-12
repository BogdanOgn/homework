import { Module } from '@nestjs/common';
import { NotificationModule } from './features/notification/notification.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), NotificationModule],
})
export class NotificationServiceModule {}
