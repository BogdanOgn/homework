import { applyDecorators, Get, HttpCode, HttpStatus } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
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
