import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { CookieOptions } from 'express';
import ms, { StringValue } from 'ms';
import { UserService } from '@features/user/user.service.js';
import { UserResponse } from '@features/user/types/user.types.js';
import { RefreshToken } from '@generated/prisma/client.js';
import { isDev } from '@common/utils/is-dev.util.js';
import { ITokenPayload, ITokensResponse } from '../types/token.types.js';
import { TokenRepository } from '../repositories/token.repository.js';
import { hashToken } from '../utils/hash-token.util.js';
import { randomUUID } from 'crypto';

@Injectable()
export class TokenService {
  private readonly logger = new Logger('TokenService');
  private readonly JWT_ACCESS_TOKEN_TTL: StringValue;
  private readonly JWT_REFRESH_TOKEN_TTL: StringValue;
  private readonly JWT_ACCESS_SECRET: string;
  private readonly JWT_REFRESH_SECRET: string;
  private readonly COOKIE_DOMAIN: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly tokenRepository: TokenRepository,
    private readonly userService: UserService,
  ) {
    this.JWT_ACCESS_TOKEN_TTL = configService.getOrThrow<StringValue>(
      'JWT_ACCESS_TOKEN_TTL',
    );
    this.JWT_REFRESH_TOKEN_TTL = configService.getOrThrow<StringValue>(
      'JWT_REFRESH_TOKEN_TTL',
    );
    this.JWT_ACCESS_SECRET =
      configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.JWT_REFRESH_SECRET =
      configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.COOKIE_DOMAIN = configService.getOrThrow<string>('COOKIE_DOMAIN');
  }

  async generateTokens(payload: ITokenPayload): Promise<ITokensResponse> {
    const { id, login, email } = payload;

    const tokenPayload = { id, login, email };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(tokenPayload, {
        secret: this.JWT_ACCESS_SECRET,
        expiresIn: this.JWT_ACCESS_TOKEN_TTL,
      }),
      this.jwtService.signAsync(
        { ...tokenPayload, jti: randomUUID() },
        {
          secret: this.JWT_REFRESH_SECRET,
          expiresIn: this.JWT_REFRESH_TOKEN_TTL,
        },
      ),
    ]);

    await this.tokenRepository.create({
      token: hashToken(refreshToken),
      userId: id,
      expiresAt: new Date(Date.now() + ms(this.JWT_REFRESH_TOKEN_TTL)),
    });

    this.logger.log('[Generate Tokens]: Tokens has been sign');
    return { accessToken, refreshToken };
  }

  async validateRefreshToken(token: string): Promise<UserResponse> {
    const storedToken = await this.find(token);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.expiresAt < new Date()) {
      await this.deleteManyByToken(token);
      throw new UnauthorizedException('Invalid refresh token');
    }
    try {
      const payload = await this.jwtService.verifyAsync<ITokenPayload>(token, {
        secret: this.JWT_REFRESH_SECRET,
      });

      const user = await this.userService.findById(payload.id);

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return user;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async find(token: string): Promise<RefreshToken | null> {
    return await this.tokenRepository.find(hashToken(token));
  }

  async deleteManyByToken(token: string): Promise<void> {
    await this.tokenRepository.deleteManyByToken(hashToken(token));
  }

  async deleteManyByExpires(userId: string): Promise<void> {
    await this.tokenRepository.deleteManyByExpires(userId);
  }

  async deleteManyByUserId(userId: string): Promise<void> {
    await this.tokenRepository.deleteManyByUserId(userId);
  }

  getRefreshTokenCookie(): CookieOptions {
    return {
      httpOnly: true,
      domain: this.COOKIE_DOMAIN,
      maxAge: ms(this.JWT_REFRESH_TOKEN_TTL),
      secure: !isDev(this.configService),
      sameSite: isDev(this.configService) ? 'lax' : 'none',
    };
  }
}
