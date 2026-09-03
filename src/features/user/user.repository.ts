import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ICreateUserData,
  IUsersListResponse,
  UserResponse,
  UserResponseWithPassword,
} from './types/user.types.js';
import { UsersFiltersDto } from './dto/users-filters.dto.js';

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

  async findMany(filters: UsersFiltersDto): Promise<IUsersListResponse> {
    const pageSize = filters.pageSize ?? 10;
    const page = filters.page ?? 1;

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
        take: pageSize,
        skip: (page - 1) * pageSize,
        orderBy: { login: 'asc' },
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
      where: { email, deletedAt: null },
    });

    return user;
  }

  async findByLogin(login: string): Promise<UserResponse | null> {
    const user = await this.prismaService.user.findUnique({
      omit: {
        password: true,
      },
      where: { login, deletedAt: null },
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
    });

    return user;
  }

  async softDelete(id: string) {
    await this.prismaService.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
