import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ICreateUserData,
  UpdateUserData,
  UserResponse,
  UserResponseWithPassword,
  UserUploadAvatarResponse,
} from './types/user.types.js';
import { UsersFiltersDto } from './dto/users-filters.dto.js';
import { UsersListResponseDto } from './dto/users-list-response.dto.js';
import { SORT_BY } from './enums/sort-by.enum.js';
import { SORT_ORDER } from './enums/sort-order.enum.js';
import { UserAvatarFilters } from './dto/user-avatar-filters.dto.js';
import { UserActiveFiltersDto } from './dto/user-active-filters.dto.js';
import { UsersListActiveResponseDto } from './dto/users-list-active-response.dto.js';

@Injectable()
export class UserRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async create(dto: ICreateUserData): Promise<UserResponse> {
    const user = await this.prismaService.user.create({
      omit: {
        password: true,
      },
      data: dto,
    });

    return user;
  }

  async findMany(filters: UsersFiltersDto): Promise<UsersListResponseDto> {
    const pageSize = filters.pageSize ?? 10;
    const page = filters.page ?? 1;

    const orderBy = {
      [filters.sortBy ?? SORT_BY.LOGIN]: filters.sortOrder ?? SORT_ORDER.ASC,
    };

    const where = {
      login: {
        contains: filters.search,
        mode: 'insensitive',
      },
      deletedAt: null,
    } as const;

    const [total, users] = await Promise.all([
      this.prismaService.user.count({ where }),
      this.prismaService.user.findMany({
        omit: {
          password: true,
        },
        where,
        include: {
          avatars: {
            where: {
              deletedAt: null,
            },
          },
        },
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy,
      }),
    ]);

    return {
      users,
      total,
      pageSize,
      page,
      pages: total > 0 ? Math.ceil(total / pageSize) : 0,
    };
  }

  async findByEmail(email: string): Promise<UserResponse | null> {
    const user = await this.prismaService.user.findUnique({
      omit: {
        password: true,
      },
      where: { email },
      include: {
        avatars: true,
      },
    });

    return user;
  }

  async findByLogin(login: string): Promise<UserResponse | null> {
    const user = await this.prismaService.user.findUnique({
      omit: {
        password: true,
      },
      where: { login },
      include: {
        avatars: true,
      },
    });

    return user;
  }

  async findByLoginWithPassword(
    login: string,
  ): Promise<UserResponseWithPassword | null> {
    const user = await this.prismaService.user.findUnique({
      where: { login, deletedAt: null },
    });

    return user;
  }

  async findById(id: string): Promise<UserResponse | null> {
    const user = await this.prismaService.user.findUnique({
      omit: {
        password: true,
      },
      where: { id, deletedAt: null },
      include: {
        avatars: {
          where: {
            deletedAt: null,
          },
        },
      },
    });

    return user;
  }

  async softDelete(id: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async update(id: string, dto: UpdateUserData): Promise<UserResponse> {
    const user = await this.prismaService.user.update({
      omit: {
        password: true,
      },
      where: { id },
      data: {
        login: dto.login,
        email: dto.email,
        aboutDescription: dto.aboutDescription,
        password: dto.password,
        age: dto.age,
      },
      include: {
        avatars: true,
      },
    });

    return user;
  }

  async findAvatarsByUserId(
    userId: string,
    filters?: UserAvatarFilters,
  ): Promise<UserUploadAvatarResponse[]> {
    const hasDeleted = filters?.hasDeleted ? {} : { deletedAt: null };

    const avatars = await this.prismaService.avatar.findMany({
      where: {
        userId,
        ...hasDeleted,
      },
    });

    return avatars;
  }

  async avatarUpload(
    userId: string,
    path: string,
  ): Promise<UserUploadAvatarResponse> {
    const avatar = await this.prismaService.avatar.create({
      data: {
        userId,
        path,
      },
    });

    return avatar;
  }

  async avatarSoftDelete(avatarId: string, userId: string): Promise<void> {
    await this.prismaService.avatar.updateMany({
      where: {
        id: avatarId,
        userId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async findActiveUsers(
    filters: UserActiveFiltersDto,
  ): Promise<UsersListActiveResponseDto> {
    const pageSize = filters.pageSize ?? 10;
    const page = filters.page ?? 1;

    const usersWithAvatars = await this.prismaService.avatar.groupBy({
      by: ['userId'],
      where: { deletedAt: null },
      having: {
        id: { _count: { gte: 2 } },
      },
    });

    const usersIdsWithAvatars = usersWithAvatars.map((user) => user.userId);

    const where = {
      id: {
        in: usersIdsWithAvatars,
      },
      aboutDescription: { not: null },
      deletedAt: null,
      age: {
        gte: filters.minAge,
        lte: filters.maxAge,
      },
    } as const;

    const [total, users] = await Promise.all([
      this.prismaService.user.count({ where }),
      this.prismaService.user.findMany({
        omit: {
          password: true,
        },
        where,

        include: {
          avatars: {
            where: {
              deletedAt: null,
            },
            orderBy: {
              createdAt: 'asc',
            },
            take: -1,
          },
        },

        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
    ]);

    return {
      users,
      total,
      pageSize,
      page,
      pages: total > 0 ? Math.ceil(total / pageSize) : 0,
    };
  }
}
