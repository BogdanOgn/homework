import {
  applyDecorators,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AccessTokenAuthorization } from '@auth/decorators/authorization.decorator.js';
import { UserResponseDto } from '@features/user/dto/user-response.dto.js';
import { UsersListResponseDto } from '../dto/users-list-response.dto.js';

export const ApiMe = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Get current user',
    }),
    ApiOkResponse({ type: UserResponseDto }),
    ApiUnauthorizedResponse({ description: 'User not found' }),
    ApiBearerAuth(),
    Throttle({ default: { limit: 10, ttl: 60000 } }),
    Get('me'),
    HttpCode(HttpStatus.OK),
  );
};

export const ApiFindAll = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Get users list',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorization' }),
    ApiOkResponse({ type: UsersListResponseDto }),
    ApiBearerAuth(),
    SkipThrottle(),
    Get('users'),
    HttpCode(HttpStatus.OK),
  );
};
export const ApiDelete = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Soft delete user',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorization' }),
    ApiOkResponse({
      description: 'User soft deleted',
      schema: { type: 'string', example: 'OK' },
    }),
    ApiBearerAuth(),
    SkipThrottle(),
    Delete(':id'),
    HttpCode(HttpStatus.OK),
  );
};
export const ApiUpdate = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Update user',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorization' }),
    ApiOkResponse({ type: UserResponseDto }),
    ApiBearerAuth(),
    Throttle({ default: { limit: 10, ttl: 60000 } }),
    Patch(':id'),
    HttpCode(HttpStatus.OK),
  );
};
