import { Module } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway.js';
import { AccessTokenModule, JwtStrategy } from '@app/common';
import { NotificationController } from './notification.controller.js';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [AccessTokenModule, PassportModule],
  controllers: [NotificationController],
  providers: [NotificationGateway, JwtStrategy],
})
export class NotificationModule {}
