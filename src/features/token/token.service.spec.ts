import { afterEach, beforeEach, expect, describe, it, vi } from 'vitest';
import { TokenService } from './token.service.js';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import ms, { type StringValue } from 'ms';
import type { RefreshToken } from '@generated/prisma/client.js';
import { TokenRepository } from './token.repository.js';
import { hashToken } from './utils/hash-token.util.js';
import { ITokenPayload } from './types/token.types.js';

const DAY = 24 * 60 * 60 * 1000;

const NOW = new Date();

const refreshToken = 'refresh-token';

const signedAccessToken = 'signed-access-token';
const signedRefreshToken = 'signed-refresh-token';

const userId = 'fe46a3d6-7f2a-41d4-b008-e7b8265c7de8';

const ACCESS_TTL: StringValue = '1h';
const REFRESH_TTL: StringValue = '7d';

const fakeEnv: Record<string, string> = {
  JWT_ACCESS_TOKEN_TTL: ACCESS_TTL,
  JWT_REFRESH_TOKEN_TTL: REFRESH_TTL,
  JWT_ACCESS_SECRET: 'access-secret',
  JWT_REFRESH_SECRET: 'refresh-secret',
  COOKIE_DOMAIN: 'localhost',
};

const storedToken: RefreshToken = {
  id: '17d9a801-b868-4e26-afd4-28c9cc72fcd1',
  token: hashToken(refreshToken),
  userId,
  expiresAt: new Date(Date.now() + DAY),
  createdAt: NOW,
};

const expiredStoredToken: RefreshToken = {
  ...storedToken,
  expiresAt: new Date(Date.now() - DAY),
};

const tokenPayload: ITokenPayload = {
  id: userId,
  login: 'user',
  email: 'user@gmail.com',
};

const tokensResponse = {
  accessToken: signedAccessToken,
  refreshToken: signedRefreshToken,
};

const createTokenData = {
  token: hashToken(signedRefreshToken),
  userId,
  expiresAt: new Date(NOW.getTime() + ms(REFRESH_TTL)),
};

describe('TokenService', () => {
  let tokenService: TokenService;
  let jwtService: JwtService;
  let tokenRepository: TokenRepository;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TokenService,
        {
          provide: JwtService,
          useValue: {
            signAsync: vi.fn(),
            verifyAsync: vi.fn(),
          },
        },
        {
          provide: TokenRepository,
          useValue: {
            create: vi.fn(),
            find: vi.fn(),
            deleteManyByToken: vi.fn(),
          },
        },
      ],
    }).compile();

    tokenService = moduleRef.get(TokenService);
    jwtService = moduleRef.get(JwtService);
    tokenRepository = moduleRef.get(TokenRepository);
  });

  describe('validateRefreshToken', () => {
    it('refresh token not found in db', async () => {
      vi.mocked(tokenRepository.find).mockResolvedValue(null);

      await expect(
        tokenService.validateRefreshToken(refreshToken),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('refresh token has been expired', async () => {
      vi.mocked(tokenRepository.find).mockResolvedValue(expiredStoredToken);

      await expect(
        tokenService.validateRefreshToken(refreshToken),
      ).rejects.toThrow(UnauthorizedException);

      expect(tokenRepository.deleteManyByToken).toHaveBeenCalledWith(
        hashToken(refreshToken),
      );

      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('refresh token is fail verification', async () => {
      vi.mocked(tokenRepository.find).mockResolvedValue(storedToken);

      vi.mocked(jwtService.verifyAsync).mockRejectedValue(
        new Error('Invalid signature'),
      );

      await expect(
        tokenService.validateRefreshToken(refreshToken),
      ).rejects.toThrow(UnauthorizedException);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: fakeEnv.JWT_REFRESH_SECRET,
      });

      expect(tokenRepository.deleteManyByToken).not.toHaveBeenCalled();
    });

    it('refresh token is validated successfully', async () => {
      vi.mocked(tokenRepository.find).mockResolvedValue(storedToken);

      vi.mocked(jwtService.verifyAsync).mockResolvedValue(tokenPayload);

      await expect(
        tokenService.validateRefreshToken(refreshToken),
      ).resolves.toBe(tokenPayload);

      expect(tokenRepository.find).toHaveBeenCalledWith(
        hashToken(refreshToken),
      );

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(refreshToken, {
        secret: fakeEnv.JWT_REFRESH_SECRET,
      });

      expect(tokenRepository.deleteManyByToken).not.toHaveBeenCalled();
    });
  });

  describe('generateTokens', () => {
    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('tokens has been generated', async () => {
      vi.mocked(jwtService.signAsync)
        .mockResolvedValueOnce(signedAccessToken)
        .mockResolvedValueOnce(signedRefreshToken);

      await expect(tokenService.generateTokens(tokenPayload)).resolves.toEqual(
        tokensResponse,
      );

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(1, tokenPayload, {
        secret: fakeEnv.JWT_ACCESS_SECRET,
        expiresIn: ACCESS_TTL,
      });

      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        2,
        { ...tokenPayload, jti: expect.any(String) as string },
        {
          secret: fakeEnv.JWT_REFRESH_SECRET,
          expiresIn: REFRESH_TTL,
        },
      );

      expect(tokenRepository.create).toHaveBeenCalledWith(createTokenData);
    });
  });
});
