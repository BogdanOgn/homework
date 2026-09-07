import { Body, Controller, Logger, Res } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { ApiTags } from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import type { Response } from 'express';
import { Authorized } from './decorators/authorizade.decorator.js';
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
  private readonly logger = new Logger('AuthController');

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

    this.logger.log(`[Register]: Register user with email - ${dto.email}`);
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

    this.logger.log(`[Login]: Login user with login - ${dto.login}`);
    return { accessToken };
  }

  @ApiLogout()
  async logout(
    @Authorized() user: RefreshAuthorizedUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.clearCookie('refreshToken', this.tokenService.getRefreshTokenCookie());
    await this.authService.logout(user.refreshToken);

    this.logger.log(`[Logout]: Logout user account - ${user.id}`);
    return 'OK';
  }

  @ApiLogoutAll()
  async logoutAll(
    @Authorized() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.clearCookie('refreshToken', this.tokenService.getRefreshTokenCookie());
    await this.authService.logoutAll(user.id);

    this.logger.log(
      `[Logout All]: Logout from all users accounts - ${user.id}`,
    );
    return 'OK';
  }

  @ApiRefresh()
  async refresh(
    @Authorized() user: RefreshAuthorizedUser,
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

    this.logger.log(`[Refresh]: Tokens refreshed for user - ${user.id}`);
    return { accessToken };
  }
}
