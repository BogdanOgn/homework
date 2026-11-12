import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { IAccessTokenPayload } from '../types/access-token.types.js';

@Injectable()
export class AccessTokenService {
  private readonly JWT_ACCESS_SECRET: string;
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.JWT_ACCESS_SECRET =
      configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  async verifyToken(token: string): Promise<IAccessTokenPayload> {
    return await this.jwtService.verifyAsync<IAccessTokenPayload>(token, {
      secret: this.JWT_ACCESS_SECRET,
    });
  }
}
