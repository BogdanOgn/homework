import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import type {
  ICreateUserData,
  UserResponse,
  UserResponseWithPassword,
} from './types/user.types.js';
import { UsersFiltersDto } from './dto/users-filters.dto.js';
import { UsersListResponseDto } from './dto/users-list-response.dto.js';
import { UserUpdateDto } from './dto/user-update.dto.js';
import { SORT_BY } from './enums/sort-by.enum.js';
import { SORT_ORDER } from './enums/sort-order.enum.js';

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
    });

    return user;
  }

  async findByLogin(login: string): Promise<UserResponse | null> {
    const user = await this.prismaService.user.findUnique({
      omit: {
        password: true,
      },
      where: { login },
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

  async softDelete(id: string): Promise<void> {
    await this.prismaService.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  async update(id: string, dto: UserUpdateDto): Promise<UserResponse> {
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
    });

    return user;
  }
}
