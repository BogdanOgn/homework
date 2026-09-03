import { applyDecorators, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthResponse } from '../dto/auth.dto.js';
import { RefreshTokenAuthorization } from './authorization.decorator.js';

export const ApiRegister = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Register new user' }),
    ApiOkResponse({ type: AuthResponse }),
    ApiBadRequestResponse({ description: 'Incorrect credentials' }),
    ApiConflictResponse({
      description: 'User with this email already existing',
    }),
    ApiConflictResponse({
      description: 'User with this login already existing',
    }),
    Throttle({ default: { limit: 3, ttl: 60000 } }),
    Post('register'),
    HttpCode(HttpStatus.CREATED),
  );
};

export const ApiLogin = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Login user',
    }),
    ApiOkResponse({ type: AuthResponse }),
    ApiBadRequestResponse({ description: 'Enter your login' }),
    ApiUnauthorizedResponse({ description: 'Incorrect credentials' }),
    Throttle({ default: { limit: 3, ttl: 60000 } }),
    Post('login'),
    HttpCode(HttpStatus.OK),
  );
};
export const ApiLogout = () => {
  return applyDecorators(
    RefreshTokenAuthorization(),
    ApiOperation({
      summary: 'Logout user',
    }),
    ApiOkResponse({ description: 'OK' }),
    SkipThrottle(),
    Post('logout'),
    HttpCode(HttpStatus.OK),
  );
};
export const ApiLogoutAll = () => {
  return applyDecorators(
    RefreshTokenAuthorization(),
    ApiOperation({
      summary: 'Logout all user accounts',
    }),
    ApiOkResponse({ description: 'OK' }),
    SkipThrottle(),
    Post('logout-all'),
    HttpCode(HttpStatus.OK),
  );
};
export const ApiRefresh = () => {
  return applyDecorators(
    RefreshTokenAuthorization(),
    ApiOperation({
      summary: 'Get new tokens by refresh token',
    }),
    ApiOkResponse({ type: AuthResponse }),
    ApiUnauthorizedResponse({ description: 'Invalid refresh token' }),
    ApiCookieAuth(),
    Throttle({ default: { limit: 5, ttl: 60000 } }),
    Post('refresh'),
    HttpCode(HttpStatus.OK),
  );
};
