import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { Prisma, type User } from '@generated/prisma/client.js';
import { Role } from '@generated/prisma/enums.js';
import { UserController } from './user.controller.js';
import { UserService } from './user.service.js';
import { UsersFiltersDto } from './dto/users-filters.dto.js';
import { UsersListResponseDto } from './dto/users-list-response.dto.js';

const userId = 'fe46a3d6-7f2a-41d4-b008-e7b8265c7de8';

const authorizedUser: User = {
  id: userId,
  login: 'John Doe',
  email: 'johndoe@gmail.com',
  password: 'password',
  age: 24,
  aboutDescription: 'Lorem ipsum dolor sit amet',
  balance: new Prisma.Decimal(0),
  role: Role.USER,
  createdAt: new Date('2026-09-01T13:58:51.326Z'),
  updatedAt: new Date('2026-09-01T13:58:51.326Z'),
  deletedAt: null,
};

const { password: _password, ...userResponse }: User = authorizedUser;

const filters: UsersFiltersDto = { page: 1, pageSize: 10 };

const findAllResult: UsersListResponseDto = {
  users: [{ ...userResponse, avatars: [] }],
  total: 42,
  pageSize: 10,
  page: 1,
  pages: 5,
};

const updateDto = { login: 'new login' };
const updated = { ...userResponse, login: 'new login' };

describe('UserController', () => {
  let userController: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: {
            findMany: vi.fn(),
            softDelete: vi.fn(),
            update: vi.fn(),
          },
        },
      ],
    }).compile();

    userController = moduleRef.get(UserController);
    userService = moduleRef.get(UserService);
  });

  describe('findAll', () => {
    it('return users list', async () => {
      vi.mocked(userService.findMany).mockResolvedValue(findAllResult);

      await expect(userController.findAll(filters)).resolves.toBe(
        findAllResult,
      );
      expect(userService.findMany).toHaveBeenCalledWith(filters);
    });
  });

  describe('delete', () => {
    it('delete user', async () => {
      vi.mocked(userService.softDelete).mockResolvedValue('OK');

      await expect(userController.delete(userId)).resolves.toBe('OK');
      expect(userService.softDelete).toHaveBeenCalledWith(userId);
    });
  });

  describe('update', () => {
    it('update user', async () => {
      vi.mocked(userService.update).mockResolvedValue(updated);

      await expect(userController.update(updateDto, userId)).resolves.toBe(
        updated,
      );
      expect(userService.update).toHaveBeenCalledWith(userId, updateDto);
    });
  });

  describe('me', () => {
    it('return login user', () => {
      expect(userController.me(authorizedUser)).toBe(authorizedUser);
    });
  });
});
