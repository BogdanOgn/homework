import { User } from '../../../generated/prisma/client.js';

export interface ICreateUserData {
  login: string;
  email: string;
  password: string;
  age: number;
  aboutDescription?: string;
}

export type UserResponse = Omit<User, 'password'>;

export type UserResponseWithPassword = User;

export type AuthorizedUser = UserResponse;

export type RefreshAuthorizedUser = UserResponse & { refreshToken: string };

export type RequestUser = AuthorizedUser & { refreshToken?: string };
