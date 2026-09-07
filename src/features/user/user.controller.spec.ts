import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import type { User } from '@generated/prisma/client.js';
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
  createdAt: new Date('2026-09-01T13:58:51.326Z'),
  updatedAt: new Date('2026-09-01T13:58:51.326Z'),
  deletedAt: null,
};

const { password: _password, ...userResponse }: User = authorizedUser;

const filters: UsersFiltersDto = { page: 1, pageSize: 10 };

const findAllResult: UsersListResponseDto = {
  users: [userResponse],
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

      await expect(userController.delete(userId, authorizedUser)).resolves.toBe(
        'OK',
      );
      expect(userService.softDelete).toHaveBeenCalledWith(userId);
    });

    it('forbidden delete for another user id', async () => {
      await expect(
        userController.delete('another-id', authorizedUser),
      ).rejects.toThrow(ForbiddenException);
      expect(userService.softDelete).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('update user', async () => {
      vi.mocked(userService.update).mockResolvedValue(updated);

      await expect(
        userController.update(userId, updateDto, authorizedUser),
      ).resolves.toBe(updated);
      expect(userService.update).toHaveBeenCalledWith(userId, updateDto);
    });

    it('forbidden update for another user id', async () => {
      await expect(
        userController.update('another-id', {}, authorizedUser),
      ).rejects.toThrow(ForbiddenException);
      expect(userService.update).not.toHaveBeenCalled();
    });
  });

  describe('me', () => {
    it('return login user', () => {
      expect(userController.me(authorizedUser)).toBe(authorizedUser);
    });
  });
});
