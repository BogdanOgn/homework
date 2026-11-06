import { Body, Controller, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { ApiTags } from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import type { Response } from 'express';
import { AuthorizedUserData } from './decorators/authorized-user-data.decorator.js';
import type { User } from '../generated/prisma/client.js';
import type { RefreshAuthorizedUser } from '@features/user/types/user.types.js';
import { TokenService } from '@features/token/token.service.js';
import {
  ApiLogin,
  ApiLogout,
  ApiLogoutAll,
  ApiRefresh,
  ApiRegister,
} from './decorators/api-auth.decorator.js';
import { IAccessTokenResponse } from '@features/token/types/token.types.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @ApiRegister()
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: RegisterUserDto,
  ): Promise<IAccessTokenResponse> {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    res.cookie(
      'refreshToken',
      refreshToken,
      this.tokenService.getRefreshTokenCookie(),
    );

    return { accessToken };
  }

  @ApiLogin()
  async login(
    @Res({ passthrough: true }) res: Response,
    @Body() dto: LoginUserDto,
  ): Promise<IAccessTokenResponse> {
    const { accessToken, refreshToken } = await this.authService.login(dto);
    res.cookie(
      'refreshToken',
      refreshToken,
      this.tokenService.getRefreshTokenCookie(),
    );

    return { accessToken };
  }

  @ApiLogout()
  async logout(
    @AuthorizedUserData() user: RefreshAuthorizedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.clearCookie('refreshToken', this.tokenService.getRefreshTokenCookie());
    await this.authService.logout(user.refreshToken);

    return 'OK';
  }

  @ApiLogoutAll()
  async logoutAll(
    @AuthorizedUserData() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.clearCookie('refreshToken', this.tokenService.getRefreshTokenCookie());
    await this.authService.logoutAll(user.id);

    return 'OK';
  }

  @ApiRefresh()
  async refresh(
    @AuthorizedUserData() user: RefreshAuthorizedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<IAccessTokenResponse> {
    const { accessToken, refreshToken } = await this.authService.refresh(
      user,
      user.refreshToken,
    );
    res.cookie(
      'refreshToken',
      refreshToken,
      this.tokenService.getRefreshTokenCookie(),
    );

    return { accessToken };
  }
}
