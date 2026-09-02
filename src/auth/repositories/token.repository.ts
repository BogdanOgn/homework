import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../features/prisma/prisma.service.js';
import { ICreateToken } from '../types/token.types.js';
import { RefreshToken } from '../../generated/prisma/client.js';

@Injectable()
export class TokenRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: ICreateToken): Promise<RefreshToken | null> {
    const { token, userId, expiresAt } = dto;
    return await this.prismaService.refreshToken.create({
      data: {
        token,
        expiresAt,
        user: {
          connect: {
            id: userId,
          },
        },
      },
    });
  }

  async find(token: string): Promise<RefreshToken | null> {
    return await this.prismaService.refreshToken.findUnique({
      where: { token },
    });
  }

  async deleteManyByToken(token: string): Promise<void> {
    await this.prismaService.refreshToken.deleteMany({
      where: { token },
    });
  }

  async deleteManyByExpires(userId: string): Promise<void> {
    await this.prismaService.refreshToken.deleteMany({
      where: { userId, expiresAt: { lt: new Date() } },
    });
  }

  async deleteManyByUserId(userId: string): Promise<void> {
    await this.prismaService.refreshToken.deleteMany({
      where: { userId },
    });
  }
}
