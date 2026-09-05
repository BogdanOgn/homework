import { UserService } from '@features/user/user.service.js';
import { AuthService } from './auth.service.js';
import { TokenService } from '@features/token/token.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import {
  UserResponse,
  UserResponseWithPassword,
} from '@features/user/types/user.types.js';
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ITokenPayload } from '@features/token/types/token.types.js';

vi.mock('bcrypt');

const userId = 'fe46a3d6-7f2a-41d4-b008-e7b8265c7de8';

const existingUserLogin = 'John Doe';
const anotherUserLogin = 'Bob Doe';

const existingUserEmail = 'johndoe@gmail.com';
const anotherUserEmail = 'bobdoe@gmail.com';

const rawUserPassword = 'test-password';
const hashedUserPassword = 'hashed-test-password';

const refreshToken = 'test-refresh-token';

const userResponse: UserResponse = {
  id: userId,
  login: existingUserLogin,
  email: existingUserEmail,
  age: 24,
  aboutDescription: 'Lorem ipsum dolor sit amet',
  createdAt: new Date('2026-09-01T13:58:51.326Z'),
  updatedAt: new Date('2026-09-01T13:58:51.326Z'),
  deletedAt: null,
};

const userResponseWithPassword: UserResponseWithPassword = {
  ...userResponse,
  password: hashedUserPassword,
};

const tokenPayload: ITokenPayload = {
  id: userId,
  login: existingUserLogin,
  email: existingUserEmail,
};

const registerUserRequest = {
  login: existingUserLogin,
  email: existingUserEmail,
  password: rawUserPassword,
  age: 24,
  aboutDescription:
    'Lorem ipsum dolor sit amet consectetur adipisicing elit...',
};

const loginUserRequest = {
  login: existingUserLogin,
  password: rawUserPassword,
};

const authResponse = {
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
};

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let tokenService: TokenService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByEmail: vi.fn(),
            findByLogin: vi.fn(),
            create: vi.fn(),
            findByLoginWithPassword: vi.fn(),
            findById: vi.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            generateTokens: vi.fn(),
            deleteManyByExpires: vi.fn(),
            deleteManyByToken: vi.fn(),
            deleteManyByUserId: vi.fn(),
          },
        },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    userService = moduleRef.get(UserService);
    tokenService = moduleRef.get(TokenService);
  });

  describe('register', () => {
    it('failed register existing user by email', async () => {
      vi.mocked(userService.findByEmail).mockResolvedValue(userResponse);
      vi.mocked(userService.findByLogin).mockResolvedValue(null);

      await expect(
        authService.register({
          ...registerUserRequest,
          login: anotherUserLogin,
        }),
      ).rejects.toThrow(ConflictException);

      expect(userService.findByEmail).toHaveBeenCalledWith(existingUserEmail);

      expect(userService.create).not.toHaveBeenCalled();
      expect(tokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('failed register existing user by login', async () => {
      vi.mocked(userService.findByEmail).mockResolvedValue(null);
      vi.mocked(userService.findByLogin).mockResolvedValue(userResponse);

      await expect(
        authService.register({
          ...registerUserRequest,
          email: anotherUserEmail,
        }),
      ).rejects.toThrow(ConflictException);

      expect(userService.findByLogin).toHaveBeenCalledWith(existingUserLogin);

      expect(userService.create).not.toHaveBeenCalled();
      expect(tokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('failed register by email when login and email are both taken', async () => {
      vi.mocked(userService.findByEmail).mockResolvedValue(userResponse);
      vi.mocked(userService.findByLogin).mockResolvedValue(userResponse);

      await expect(authService.register(registerUserRequest)).rejects.toThrow(
        'User with this email already existing',
      );

      expect(userService.create).not.toHaveBeenCalled();
    });

    it('successfully register user', async () => {
      vi.mocked(userService.findByEmail).mockResolvedValue(null);
      vi.mocked(userService.findByLogin).mockResolvedValue(null);
      vi.mocked(bcrypt.hash).mockResolvedValue(hashedUserPassword as never);
      vi.mocked(userService.create).mockResolvedValue(userResponse);
      vi.mocked(tokenService.generateTokens).mockResolvedValue(authResponse);

      await expect(authService.register(registerUserRequest)).resolves.toEqual(
        authResponse,
      );

      expect(bcrypt.hash).toHaveBeenCalledWith(rawUserPassword, 10);

      expect(userService.create).toHaveBeenCalledWith({
        ...registerUserRequest,
        password: hashedUserPassword,
      });

      expect(tokenService.generateTokens).toHaveBeenCalledWith(userResponse);
    });
  });

  describe('login', () => {
    it('failed login by login is not pass', async () => {
      await expect(
        authService.login({
          ...loginUserRequest,
          login: '',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(userService.findByLoginWithPassword).not.toHaveBeenCalled();
    });

    it('failed login by user not found', async () => {
      vi.mocked(userService.findByLoginWithPassword).mockResolvedValue(null);

      await expect(
        authService.login({
          ...loginUserRequest,
          login: anotherUserLogin,
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(userService.findByLoginWithPassword).toHaveBeenCalledWith(
        anotherUserLogin,
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('failed login by incorrect password', async () => {
      vi.mocked(userService.findByLoginWithPassword).mockResolvedValue(
        userResponseWithPassword,
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(authService.login(loginUserRequest)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        rawUserPassword,
        hashedUserPassword,
      );

      expect(tokenService.deleteManyByExpires).not.toHaveBeenCalled();
      expect(tokenService.generateTokens).not.toHaveBeenCalled();
    });

    it('successfully login user', async () => {
      vi.mocked(userService.findByLoginWithPassword).mockResolvedValue(
        userResponseWithPassword,
      );
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(tokenService.generateTokens).mockResolvedValue(authResponse);

      await expect(authService.login(loginUserRequest)).resolves.toEqual(
        authResponse,
      );

      expect(bcrypt.compare).toHaveBeenCalledWith(
        rawUserPassword,
        hashedUserPassword,
      );

      expect(tokenService.deleteManyByExpires).toHaveBeenCalledWith(userId);

      expect(tokenService.generateTokens).toHaveBeenCalledWith(
        userResponseWithPassword,
      );
    });
  });

  describe('logout', () => {
    it('successfully logout user', async () => {
      await expect(authService.logout(refreshToken)).resolves.toBe('OK');

      expect(tokenService.deleteManyByToken).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('logoutAll', () => {
    it('successfully logout user from all sessions', async () => {
      await expect(authService.logoutAll(userId)).resolves.toBe('OK');

      expect(tokenService.deleteManyByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('refresh', () => {
    it('successfully refresh tokens', async () => {
      vi.mocked(tokenService.generateTokens).mockResolvedValue(authResponse);

      await expect(
        authService.refresh(tokenPayload, refreshToken),
      ).resolves.toEqual(authResponse);

      expect(tokenService.deleteManyByToken).toHaveBeenCalledWith(refreshToken);

      expect(tokenService.generateTokens).toHaveBeenCalledWith(tokenPayload);
    });
  });

  describe('validate', () => {
    it('failed validate by user not found', async () => {
      vi.mocked(userService.findById).mockResolvedValue(null);

      await expect(authService.validate(userId)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(userService.findById).toHaveBeenCalledWith(userId);
    });

    it('successfully validate user', async () => {
      vi.mocked(userService.findById).mockResolvedValue(userResponse);

      await expect(authService.validate(userId)).resolves.toBe(userResponse);

      expect(userService.findById).toHaveBeenCalledWith(userId);
    });
  });
});
