import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { RefreshAuthorizedUser } from '@features/user/types/user.types.js';
import { TokenService } from '@features/token/token.service.js';
import { UserService } from '@features/user/user.service.js';

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
    private readonly userService: UserService,
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

    const payload = await this.tokenService.validateRefreshToken(refreshToken);
    const user = await this.userService.findById(payload.id);

    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return { ...user, refreshToken };
  }
}
