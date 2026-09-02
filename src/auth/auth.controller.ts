import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Res,
} from '@nestjs/common';
import { AuthService } from './services/auth.service.js';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { RegisterUserDto } from './dto/register-user.dto.js';
import { LoginUserDto } from './dto/login-user.dto.js';
import type { Response } from 'express';
import { TokenService } from './services/token.service.js';
import {
  AccessTokenAuthorization,
  RefreshTokenAuthorization,
} from './decorators/authorization.decorator.js';
import { Authorized } from './decorators/authorizade.decorator.js';
import type { User } from '../generated/prisma/client.js';
import { AuthResponse } from './dto/auth.dto.js';
import { UserResponse } from './dto/user.dto.js';
import type { RefreshAuthorizedUser } from '../features/user/types/user.types.js';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { IAccessTokenResponse } from './types/token.types.js';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger('AuthController');

  constructor(
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @ApiOperation({ summary: 'Register new user' })
  @ApiOkResponse({ type: AuthResponse })
  @ApiBadRequestResponse({ description: 'Incorrect credentials' })
  @ApiConflictResponse({ description: 'User with this email already existing' })
  @ApiConflictResponse({ description: 'User with this login already existing' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
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

    this.logger.log(`[Register]: registering user with email - ${dto.login}`);
    return { accessToken };
  }

  @ApiOperation({
    summary: 'Login user',
  })
  @ApiOkResponse({ type: AuthResponse })
  @ApiBadRequestResponse({ description: 'Enter your login' })
  @ApiUnauthorizedResponse({ description: 'Incorrect credentials' })
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
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

    this.logger.log(`[Login]: attempting login user with login - ${dto.login}`);
    return { accessToken };
  }

  @RefreshTokenAuthorization()
  @ApiOperation({
    summary: 'Logout user',
  })
  @ApiOkResponse({ description: 'OK' })
  @SkipThrottle()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Authorized('refreshToken') refreshToken: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.clearCookie('refreshToken', this.tokenService.getRefreshTokenCookie());
    await this.authService.logout(refreshToken);
    this.logger.log('[Logout]: user logout');
    return 'OK';
  }

  @RefreshTokenAuthorization()
  @ApiOperation({
    summary: 'Logout all user accounts',
  })
  @ApiOkResponse({ description: 'OK' })
  @SkipThrottle()
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @Authorized() user: User,
    @Res({ passthrough: true }) res: Response,
  ): Promise<string> {
    res.clearCookie('refreshToken', this.tokenService.getRefreshTokenCookie());
    await this.authService.logoutAll(user.id);

    this.logger.log('[Logout]: logout all user accounts');
    return 'OK';
  }

  @RefreshTokenAuthorization()
  @ApiOperation({
    summary: 'Get new tokens by refresh token',
  })
  @ApiOkResponse({ type: AuthResponse })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  @ApiCookieAuth()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
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
    return { accessToken };
  }

  @AccessTokenAuthorization()
  @ApiOperation({
    summary: 'Get current user',
  })
  @ApiOkResponse({ type: UserResponse })
  @ApiUnauthorizedResponse({ description: 'User not found' })
  @ApiBearerAuth()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('me')
  @HttpCode(HttpStatus.OK)
  me(@Authorized() user: User): User {
    this.logger.log('[Me]: get current user accout');

    return user;
  }
}
