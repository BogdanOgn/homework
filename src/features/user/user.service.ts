import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository.js';
import type { CreateUserData } from './types/user.types.js';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(dto: CreateUserData) {
    return this.userRepository.create(dto);
  }

  async findByEmail(email: string) {
    return this.userRepository.findByEmail(email);
  }

  async findByLogin(login: string) {
    return this.userRepository.findByLogin(login);
  }

  async findByLoginWithPassword(login: string) {
    return this.userRepository.findByLoginWithPassword(login);
  }
}
