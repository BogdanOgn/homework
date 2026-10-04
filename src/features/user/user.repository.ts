import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  deletedAvatarPaths,
  IBalanceTransferResponse,
  ICreateUserData,
  UpdateUserData,
  UserResponse,
  UserResponseWithPassword,
  UserUploadAvatarResponse,
} from './types/user.types.js';
import { UsersFiltersDto } from './dto/users-filters.dto.js';
import { UsersListResponseDto } from './dto/users-list-response.dto.js';
import {
  SORT_BY_BALANCE_TRANSFERS,
  SORT_BY_USERS,
} from './enums/sort-by.enum.js';
import { SORT_ORDER } from './enums/sort-order.enum.js';
import { UserAvatarFilters } from './dto/user-avatar-filters.dto.js';
import { UserActiveFiltersDto } from './dto/user-active-filters.dto.js';
import { UsersListActiveResponseDto } from './dto/users-list-active-response.dto.js';
import { Prisma } from '@generated/prisma/client.js';
import { AVATARS_TTL } from './constants/avatars-ttl.constants.js';
import { UserBalanceTransferHistoryFiltersDto } from './dto/user-balance-transfer-history-filters.dto.js';
import { UserBalanceTransferHistoryListResponseDto } from './dto/user-balance-transfer-history-list-response.dto copy.js';

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
      [filters.sortBy ?? SORT_BY_USERS.LOGIN]:
        filters.sortOrder ?? SORT_ORDER.ASC,
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

  async findDeletedAvatarById(
    avatarId: string,
  ): Promise<UserUploadAvatarResponse | null> {
    const avatar = await this.prismaService.avatar.findFirst({
      where: {
        id: avatarId,
        deletedAt: { not: null },
      },
    });

    return avatar;
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

  async avatarRestore(
    avatarId: string,
    userId: string,
  ): Promise<UserUploadAvatarResponse> {
    return await this.prismaService.avatar.update({
      where: {
        id: avatarId,
        userId,
      },
      data: {
        deletedAt: null,
      },
    });
  }

  async findAllDeletedAvatar(): Promise<deletedAvatarPaths[]> {
    const ttlCondition = new Date(Date.now() - AVATARS_TTL);
    const deletedAvatars = await this.prismaService.avatar.findMany({
      where: { deletedAt: { not: null, lte: ttlCondition } },
    });

    const removeAvatarsArray = deletedAvatars.map((avatar) => {
      return {
        Key: avatar.path,
      };
    });

    return removeAvatarsArray;
  }

  async clearAllDeletedAvatar() {
    await this.prismaService.avatar.deleteMany({
      where: { deletedAt: { not: null } },
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

  async balanceTransfer(
    senderId: string,
    recipientId: string,
    sendedBalance: number,
  ): Promise<IBalanceTransferResponse> {
    const txData = await this.prismaService.$transaction(
      async (tx) => {
        const sender = await tx.user.update({
          data: {
            balance: { decrement: sendedBalance },
          },
          where: {
            id: senderId,
            deletedAt: null,
            balance: { gte: sendedBalance },
          },
        });

        const recipient = await tx.user.update({
          data: {
            balance: {
              increment: sendedBalance,
            },
          },
          where: { id: recipientId, deletedAt: null },
        });

        const historyTransferData = {
          senderId: sender.id,
          senderLogin: sender.login,
          recipientId: recipient.id,
          recipientLogin: recipient.login,
          sendedBalance,
        };

        await tx.balanceTransaction.create({
          data: historyTransferData,
        });

        return { sender, recipient };
      },
      {
        maxWait: 5000,
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return {
      oldBalance: +txData.sender.balance.plus(sendedBalance),
      newBalance: +txData.sender.balance,
      senderLogin: txData.sender.login,
      recipientLogin: txData.recipient.login,
    };
  }

  async getBalanceTransferHistory(
    filters: UserBalanceTransferHistoryFiltersDto,
    userId: string,
  ): Promise<UserBalanceTransferHistoryListResponseDto> {
    const pageSize = filters.pageSize ?? 10;
    const page = filters.page ?? 1;

    const where = {
      senderLogin: {
        contains: filters.search,
        mode: 'insensitive',
      },
      recipientLogin: {
        contains: filters.search,
        mode: 'insensitive',
      },
      sendedBalance: {
        gte: filters.minBalance,
        lte: filters.maxBalance,
      },
    } as const;

    const orderBy = {
      [filters.sortBy ?? SORT_BY_BALANCE_TRANSFERS.CREATED_AT]:
        filters.sortOrder ?? SORT_ORDER.ASC,
    };

    const [total, history] = await Promise.all([
      this.prismaService.balanceTransaction.count({
        where: {
          OR: [{ senderId: userId }, { recipientId: userId }],
          ...where,
        },
      }),
      this.prismaService.balanceTransaction.findMany({
        where,
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy,
      }),
    ]);

    return {
      history,
      total,
      pageSize,
      page,
      pages: total > 0 ? Math.ceil(total / pageSize) : 0,
    };
  }
}
