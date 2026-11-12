import type { IAccessTokenPayload } from '@app/common';
import type { DefaultEventsMap, Namespace, Socket } from 'socket.io';

export interface IPongResponse {
  message: string;
  pingAt: string;
}

export interface ITransferNotification {
  eventId: string;
  fromUserId: string;
  toUserId: string;
  amount: string;
  occurredAt: string;
}

export interface ISocketData {
  user: IAccessTokenPayload;
}

export type AuthSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  ISocketData
>;

export type NotificationNamespace = Namespace<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  ISocketData
>;
