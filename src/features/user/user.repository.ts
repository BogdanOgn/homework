import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateUserData } from './types/user.types.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: CreateUserData) {
    const user = await this.prismaService.user.create({
      omit: {
        password: true,
      },
      data: dto,
    });

    return user;
  }

  async findByEmail(email: string) {
    const user = await this.prismaService.user.findUnique({
      omit: {
        password: true,
      },
      where: { email },
    });

    return user;
  }

  async findByLogin(login: string) {
    const user = await this.prismaService.user.findUnique({
      omit: {
        password: true,
      },
      where: { login },
    });

    return user;
  }
  async findByLoginWithPassword(login: string) {
    const user = await this.prismaService.user.findUnique({
      where: { login },
    });

    return user;
  }
}
