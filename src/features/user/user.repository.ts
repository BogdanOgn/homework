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
import { BalanceTransaction, Prisma } from '@generated/prisma/client.js';
import { UserBalanceTransferHistoryFiltersDto } from './dto/user-balance-transfer-history-filters.dto.js';
import { UserBalanceTransferHistoryListResponseDto } from './dto/user-balance-transfer-history-list-response.dto.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserRepository {
  private readonly AVATARS_DELETED_TTL: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
  ) {
    this.AVATARS_DELETED_TTL = this.configService.getOrThrow<string>(
      'AVATARS_DELETED_TTL',
    );
  }

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
  ): Promise<UserUploadAvatarResponse | { hasLimit: boolean }> {
    try {
      return await this.prismaService.$transaction(
        async (tx) => {
          const totalAvatars = await tx.avatar.count({
            where: { userId, deletedAt: null },
          });

          if (totalAvatars >= 5) {
            return { hasLimit: true };
          }

          const avatar = await tx.avatar.create({
            data: {
              userId,
              path,
            },
          });

          return avatar;
        },
        {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        return { hasLimit: true };
      }

      throw error;
    }
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
  ): Promise<UserUploadAvatarResponse | { hasLimit: true }> {
    try {
      return await this.prismaService.$transaction(
        async (tx) => {
          const totalAvatars = await tx.avatar.count({
            where: {
              userId,
              deletedAt: null,
            },
          });

          if (totalAvatars >= 5) {
            return { hasLimit: true };
          }

          return await tx.avatar.update({
            where: {
              id: avatarId,
              userId,
            },
            data: {
              deletedAt: null,
            },
          });
        },
        {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2034'
      ) {
        return { hasLimit: true };
      }

      throw error;
    }
  }

  async findAllPathsDeletedAvatar(take: number): Promise<deletedAvatarPaths[]> {
    const ttlCondition = new Date(
      Date.now() - Number(this.AVATARS_DELETED_TTL),
    );

    const deletedAvatars = await this.prismaService.avatar.findMany({
      where: { deletedAt: { not: null, lte: ttlCondition } },
      take,
      orderBy: {
        id: SORT_ORDER.ASC,
      },
    });

    const deletedAvatarsArray = deletedAvatars.map((avatar) => {
      return {
        Key: avatar.path,
        id: avatar.id,
      };
    });

    return deletedAvatarsArray;
  }

  async clearAllDeletedAvatar(paths: string[]): Promise<void> {
    await this.prismaService.avatar.deleteMany({
      where: { path: { in: paths } },
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
              createdAt: SORT_ORDER.ASC,
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
    idempotencyKey: string,
  ): Promise<
    | IBalanceTransferResponse
    | { idempotencyKeyException: boolean }
    | { balanceException: true }
  > {
    try {
      return await this.prismaService.$transaction(
        async (tx) => {
          const existingTransfer = await this.getExistingTransfer(
            tx,
            senderId,
            recipientId,
            sendedBalance,
            idempotencyKey,
          );

          if (existingTransfer) {
            return existingTransfer;
          }

          const senderUpdated = await tx.user.update({
            data: {
              balance: { decrement: sendedBalance },
            },
            where: {
              id: senderId,
              deletedAt: null,
              balance: { gte: sendedBalance },
            },
          });

          const recipientUpdated = await tx.user.update({
            data: {
              balance: {
                increment: sendedBalance,
              },
            },
            where: { id: recipientId, deletedAt: null },
          });

          const balanceHistory = await tx.balanceTransaction.create({
            data: {
              senderId: senderUpdated.id,
              senderLogin: senderUpdated.login,
              senderOldBalance: +senderUpdated.balance.plus(sendedBalance),
              senderNewBalance: senderUpdated.balance,
              recipientId: recipientUpdated.id,
              recipientLogin: recipientUpdated.login,
              sendedBalance,
              idempotencyKey,
            },
          });

          return this.transferResponse(balanceHistory);
        },
        {
          maxWait: 5000,
          timeout: 10000,
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          return { balanceException: true };
        }

        if (error.code === 'P2002' || error.code === 'P2034') {
          const existingTransfer = await this.getExistingTransfer(
            this.prismaService,
            senderId,
            recipientId,
            sendedBalance,
            idempotencyKey,
          );

          if (existingTransfer) {
            return existingTransfer;
          }
        }
      }

      throw error;
    }
  }

  async getBalanceTransferHistory(
    filters: UserBalanceTransferHistoryFiltersDto,
    userId: string,
  ): Promise<UserBalanceTransferHistoryListResponseDto> {
    const pageSize = filters.pageSize ?? 10;
    const page = filters.page ?? 1;

    const where: Prisma.BalanceTransactionWhereInput = {
      AND: [
        { OR: [{ senderId: userId }, { recipientId: userId }] },
        {
          OR: [
            {
              senderLogin: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
            {
              recipientLogin: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
      sendedBalance: {
        gte: filters.minBalance,
        lte: filters.maxBalance,
      },
    };

    const orderBy = {
      [filters.sortBy ?? SORT_BY_BALANCE_TRANSFERS.CREATED_AT]:
        filters.sortOrder ?? SORT_ORDER.ASC,
    };

    const [total, history] = await Promise.all([
      this.prismaService.balanceTransaction.count({
        where,
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

  private transferResponse(data: BalanceTransaction): IBalanceTransferResponse {
    return {
      oldBalance: +data.senderOldBalance,
      newBalance: +data.senderNewBalance,
      senderLogin: data.senderLogin,
      recipientLogin: data.recipientLogin,
    };
  }

  private async getExistingTransfer(
    client: Prisma.TransactionClient,
    senderId: string,
    recipientId: string,
    sendedBalance: number,
    idempotencyKey: string,
  ): Promise<
    IBalanceTransferResponse | { idempotencyKeyException: true } | null
  > {
    const existingTransaction = await client.balanceTransaction.findUnique({
      where: {
        senderId_idempotencyKey: {
          senderId,
          idempotencyKey,
        },
      },
    });

    if (!existingTransaction) return null;

    if (
      existingTransaction.recipientId !== recipientId ||
      !existingTransaction.sendedBalance.equals(sendedBalance)
    ) {
      return { idempotencyKeyException: true };
    }

    return this.transferResponse(existingTransaction);
  }
}
