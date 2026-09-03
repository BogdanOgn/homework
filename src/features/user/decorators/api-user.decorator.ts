import {
  applyDecorators,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AccessTokenAuthorization } from '@auth/decorators/authorization.decorator.js';
import { UserResponse } from '@auth/dto/user.dto.js';

export const ApiMe = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Get current user',
    }),
    ApiOkResponse({ type: UserResponse }),
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
    ApiOkResponse({ type: UserResponse }),
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
