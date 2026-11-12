import { Body, Controller } from '@nestjs/common';
import { ApiSendNotification } from './decorators/api-notification.decorator.js';
import { ApiTags } from '@nestjs/swagger';
import { NotificationGateway } from './notification.gateway.js';
import { SendNotificationDto } from './dto/send-notification.dto.js';
import { randomUUID } from 'crypto';

@ApiTags('Notification')
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationGateway: NotificationGateway) {}

  @ApiSendNotification()
  sendNotification(@Body() dto: SendNotificationDto): void {
    const { toUserId } = dto;

    const notification = {
      ...dto,
      eventId: randomUUID(),
      occurredAt: new Date().toISOString(),
    };

    this.notificationGateway.sendNotification(toUserId, notification);
  }
}
