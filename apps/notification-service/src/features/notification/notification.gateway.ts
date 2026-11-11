import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { type IPongResponse } from './types/notification.types.js';

@WebSocketGateway({
  namespace: 'notifications',
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class NotificationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected - ${client.id}`);

    client.emit('connected', {
      id: client.id,
      message: 'Client was succesfuly connected',
      connectedAt: new Date().toISOString(),
    });

    client.conn.on('packetCreate', ({ type }) => {
      if (type === 'ping')
        this.logger.debug({
          id: client.id,
          date: new Date().toISOString(),
          type: 'ping',
        });
    });

    client.conn.on('packet', ({ type }) => {
      if (type === 'pong')
        this.logger.debug({
          id: client.id,
          date: new Date().toISOString(),
          type: 'pong',
        });
    });
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected - ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(): IPongResponse {
    return {
      message: 'pong',
      pingAt: new Date().toISOString(),
    };
  }
}
