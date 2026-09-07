import { TokenService } from '@features/token/token.service.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import type { User } from '@generated/prisma/client.js';
import type { RefreshAuthorizedUser } from '@features/user/types/user.types.js';

const userId = 'fe46a3d6-7f2a-41d4-b008-e7b8265c7de8';

const cookieOptions: CookieOptions = {
  httpOnly: true,
  domain: 'localhost',
  maxAge: 604800000,
  secure: false,
  sameSite: 'lax',
};

const tokens = { accessToken: 'access-token', refreshToken: 'refresh-token' };

const refreshedTokens = {
  accessToken: 'new-access-token',
  refreshToken: 'new-refresh-token',
};

const registerRequest = {
  login: 'John Doe',
  email: 'johndoe@gmail.com',
  password: 'password',
  age: 24,
};

const loginRequest = {
  login: registerRequest.login,
  password: registerRequest.password,
};

const authorizedUser: User = {
  id: userId,
  login: registerRequest.login,
  email: registerRequest.email,
  password: registerRequest.password,
  age: registerRequest.age,
  aboutDescription: null,
  createdAt: new Date('2026-09-01T13:58:51.326Z'),
  updatedAt: new Date('2026-09-01T13:58:51.326Z'),
  deletedAt: null,
};

const { password: _password, ...userResponse } = authorizedUser;

const refreshAuthorizedUser: RefreshAuthorizedUser = {
  ...userResponse,
  refreshToken: tokens.refreshToken,
};

const createResponse = () =>
  ({
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  }) as unknown as Response;

describe('AuthConteroller', () => {
  let authController: AuthController;
  let authService: AuthService;
  let tokenService: TokenService;
  let res: Response;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            register: vi.fn(),
            login: vi.fn(),
            logout: vi.fn(),
            logoutAll: vi.fn(),
            refresh: vi.fn(),
          },
        },
        {
          provide: TokenService,
          useValue: {
            getRefreshTokenCookie: vi.fn(),
          },
        },
      ],
    }).compile();

    authController = moduleRef.get(AuthController);
    authService = moduleRef.get(AuthService);
    tokenService = moduleRef.get(TokenService);
    res = createResponse();
  });

  describe('register', () => {
    it('register user and set refresh token cookie', async () => {
      vi.mocked(authService.register).mockResolvedValue(tokens);
      vi.mocked(tokenService.getRefreshTokenCookie).mockReturnValue(
        cookieOptions,
      );

      await expect(
        authController.register(res, registerRequest),
      ).resolves.toEqual({
        accessToken: tokens.accessToken,
      });

      expect(authService.register).toHaveBeenCalledWith(registerRequest);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokens.refreshToken,
        cookieOptions,
      );
    });

    it('not set cookie with register fail', async () => {
      vi.mocked(authService.register).mockRejectedValue(
        new ConflictException('User already exists'),
      );

      await expect(
        authController.register(res, registerRequest),
      ).rejects.toThrow(ConflictException);
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('login user and set refresh token cookie', async () => {
      vi.mocked(authService.login).mockResolvedValue(tokens);
      vi.mocked(tokenService.getRefreshTokenCookie).mockReturnValue(
        cookieOptions,
      );

      await expect(authController.login(res, loginRequest)).resolves.toEqual({
        accessToken: tokens.accessToken,
      });

      expect(authService.login).toHaveBeenCalledWith(loginRequest);
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        tokens.refreshToken,
        cookieOptions,
      );
    });

    it('not set cookie with login fail', async () => {
      vi.mocked(authService.login).mockRejectedValue(
        new UnauthorizedException('Incorrect credentials'),
      );

      await expect(authController.login(res, loginRequest)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('successfully user logout', async () => {
      vi.mocked(authService.logout).mockResolvedValue('OK');
      vi.mocked(tokenService.getRefreshTokenCookie).mockReturnValue(
        cookieOptions,
      );

      await expect(
        authController.logout(refreshAuthorizedUser, res),
      ).resolves.toBe('OK');

      expect(authService.logout).toHaveBeenCalledWith(tokens.refreshToken);
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        cookieOptions,
      );
    });
  });

  describe('logout-all', () => {
    it('successfully user logout from all accounts', async () => {
      vi.mocked(authService.logoutAll).mockResolvedValue('OK');
      vi.mocked(tokenService.getRefreshTokenCookie).mockReturnValue(
        cookieOptions,
      );

      await expect(authController.logoutAll(authorizedUser, res)).resolves.toBe(
        'OK',
      );

      expect(authService.logoutAll).toHaveBeenCalledWith(userId);
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        cookieOptions,
      );
    });
  });

  describe('refresh', () => {
    it('refresh tokens and set new refresh token cookie', async () => {
      vi.mocked(authService.refresh).mockResolvedValue(refreshedTokens);
      vi.mocked(tokenService.getRefreshTokenCookie).mockReturnValue(
        cookieOptions,
      );

      await expect(
        authController.refresh(refreshAuthorizedUser, res),
      ).resolves.toEqual({ accessToken: refreshedTokens.accessToken });

      expect(authService.refresh).toHaveBeenCalledWith(
        refreshAuthorizedUser,
        tokens.refreshToken,
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        refreshedTokens.refreshToken,
        cookieOptions,
      );
    });

    it('not set cookie with refresh fail', async () => {
      vi.mocked(authService.refresh).mockRejectedValue(
        new UnauthorizedException('Invalid refresh token'),
      );

      await expect(
        authController.refresh(refreshAuthorizedUser, res),
      ).rejects.toThrow(UnauthorizedException);
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });
});
