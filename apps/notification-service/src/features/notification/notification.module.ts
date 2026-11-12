import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway.js';
import { AccessTokenModule } from '@app/common';
import { NotificationController } from './notification.controller.js';

@Module({
  imports: [AccessTokenModule],
  controllers: [NotificationController],
  providers: [NotificationGateway],
})
export class NotificationModule {}
