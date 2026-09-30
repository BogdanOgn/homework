import { PrismaService } from '@features/prisma/prisma.service.js';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ImagesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findImagesByUserId(userId: string) {
    const images = await this.prismaService.avatar.findMany({
      where: { userId, deletedAt: null },
      omit: {
        deletedAt: true,
      },
    });

    return images;
  }
}
