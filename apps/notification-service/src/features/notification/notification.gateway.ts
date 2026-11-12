import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import type {
  ITransferNotification,
  NotificationNamespace,
  IPongResponse,
  AuthSocket,
} from './types/notification.types.js';
import { AccessTokenService } from '@app/common';

@WebSocketGateway({
  namespace: 'notifications',
  pingInterval: 25000,
  pingTimeout: 20000,
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationGateway.name);
  constructor(private readonly accessTokenService: AccessTokenService) {}

  @WebSocketServer()
  private readonly server!: NotificationNamespace;

  afterInit(server: NotificationNamespace): void {
    this.logger.log(`Client init`);

    server.use((socket, next) => {
      void this.authUser(socket, next);
    });
  }

  handleConnection(client: AuthSocket): void {
    this.logger.log(`Client connected - ${client.id}`);

    void client.join(`user:${client.data.user.id}`);

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

  handleDisconnect(client: AuthSocket): void {
    this.logger.log(`Client disconnected - ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(): IPongResponse {
    return {
      message: 'pong',
      pingAt: new Date().toISOString(),
    };
  }

  sendNotification(userId: string, payload: ITransferNotification): void {
    this.server.to(`user:${userId}`).emit('notification', payload);
  }

  private async authUser(
    socket: AuthSocket,
    next: (err?: Error) => void,
  ): Promise<void> {
    const token = socket.handshake.headers.authorization?.replace(
      'Bearer ',
      '',
    );

    if (!token) {
      next(new Error('Invalid Access Token'));
      return;
    }

    try {
      const payload = await this.accessTokenService.verifyToken(token);
      this.logger.log('Access Token Payload', { ...payload });
      socket.data.user = payload;
      next();
    } catch (error: unknown) {
      this.logger.error('Invalid Access Token', { error });
      next(new Error('Invalid Access Token'));
    }
  }
}
