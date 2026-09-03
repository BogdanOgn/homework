import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../services/auth.service.js';
import { Request } from 'express';
import { TokenService } from '../services/token.service.js';
import { RefreshAuthorizedUser } from '@features/user/types/user.types.js';

const extractRefreshToken = (req: Request): string | null => {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;

  return cookies?.refreshToken ?? null;
};

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractRefreshToken]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request): Promise<RefreshAuthorizedUser> {
    const refreshToken = extractRefreshToken(req);

    if (!refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.tokenService.validateRefreshToken(refreshToken);

    return { ...user, refreshToken };
  }
}
