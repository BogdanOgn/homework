import { AccessTokenAuthorization } from '@auth/decorators/authorization.decorator.js';
import { applyDecorators, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

export const ApiAvatarCleanup = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Clear deleted user avatars',
    }),
    ApiOkResponse({ example: 'OK' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiBearerAuth(),
    Throttle({ default: { limit: 10, ttl: 60000 } }),
    Post(),
    HttpCode(HttpStatus.ACCEPTED),
  );
};
