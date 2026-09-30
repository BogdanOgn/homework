import { PrismaService } from '@features/prisma/prisma.service.js';
import { UserAvatarFilters } from '@features/user/dto/user-avatar-filters.dto.js';
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

  async findAllImagesByUserId(userId: string, filters: UserAvatarFilters) {
    const hasDeleted = filters.hasDeleted ? {} : { deletedAt: null };

    const images = await this.prismaService.avatar.findMany({
      where: {
        userId,
        ...hasDeleted,
      },
    });

    return images;
  }
}
