import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository.js';
import type {
  ICreateUserData,
  UserResponse,
  UserResponseWithPassword,
} from './types/user.types.js';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(dto: ICreateUserData): Promise<UserResponse> {
    return this.userRepository.create(dto);
  }

  async findByEmail(email: string): Promise<UserResponse | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByLogin(login: string): Promise<UserResponse | null> {
    return this.userRepository.findByLogin(login);
  }

  async findByLoginWithPassword(
    login: string,
  ): Promise<UserResponseWithPassword | null> {
    return this.userRepository.findByLoginWithPassword(login);
  }

  async findById(id: string): Promise<UserResponse | null> {
    return await this.userRepository.findById(id);
  }
}
