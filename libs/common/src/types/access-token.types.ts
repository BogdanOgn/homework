import { Role } from './user.types.js';

export interface IAccessTokenPayload {
  id: string;
  login: string;
  email: string;
  role: Role;
}
