import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { TokenService } from '@features/token/token.service.js';
import { UserService } from './user.service.js';
import { UserRepository } from './user.repository.js';
import { UserUpdateDto } from './dto/user-update.dto.js';
import type { UserResponse } from './types/user.types.js';

vi.mock('bcrypt');

const userId = 'fe46a3d6-7f2a-41d4-b008-e7b8265c7de8';

const userResponse: UserResponse = {
  id: userId,
  login: 'John Doe',
  email: 'johndoe@gmail.com',
  age: 24,
  aboutDescription: 'Lorem ipsum dolor sit amet',
  createdAt: new Date('2026-09-01T13:58:51.326Z'),
  updatedAt: new Date('2026-09-01T13:58:51.326Z'),
  deletedAt: null,
};

describe('UserService', () => {
  let userService: UserService;
  let userRepository: UserRepository;
  let tokenService: TokenService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepository,
          useValue: {
            update: vi.fn(),
            softDelete: vi.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            deleteManyByUserId: vi.fn(),
          },
        },
      ],
    }).compile();

    userService = moduleRef.get(UserService);
    userRepository = moduleRef.get(UserRepository);
    tokenService = moduleRef.get(TokenService);
  });

  describe('update', () => {
    it('update user with hashed password', async () => {
      const dto: UserUpdateDto = { login: 'new login', password: 'plain123' };
      vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
      vi.mocked(userRepository.update).mockResolvedValue(userResponse);

      await expect(userService.update(userId, dto)).resolves.toBe(userResponse);

      expect(bcrypt.hash).toHaveBeenCalledWith('plain123', 10);

      expect(userRepository.update).toHaveBeenCalledWith(userId, {
        login: 'new login',
        password: 'hashed-password',
      });
    });

    it('update user without password', async () => {
      const dto: UserUpdateDto = { login: 'new login' };
      vi.mocked(userRepository.update).mockResolvedValue(userResponse);

      await userService.update(userId, dto);

      expect(bcrypt.hash).not.toHaveBeenCalled();
      expect(userRepository.update).toHaveBeenCalledWith(userId, dto);
    });
  });

  describe('softDelete', () => {
    it('soft delete user and delete all tokens', async () => {
      await expect(userService.softDelete(userId)).resolves.toBe('OK');

      expect(userRepository.softDelete).toHaveBeenCalledWith(userId);
      expect(tokenService.deleteManyByUserId).toHaveBeenCalledWith(userId);
    });
  });
});
