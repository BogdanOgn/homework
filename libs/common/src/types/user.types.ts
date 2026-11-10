import { Request } from 'express';

export const Role = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type Role = (typeof Role)[keyof typeof Role];

export type RequestUser = {
  id: string;
  role: Role;
};

export type RequestWithUser = Request & { user?: RequestUser };
