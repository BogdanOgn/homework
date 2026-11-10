import { AccessTokenAuthorization } from '@app/common';
import { Role } from '@generated/prisma/enums.js';
import { applyDecorators, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

export const ApiAvatarCleanup = () => {
  return applyDecorators(
    AccessTokenAuthorization(Role.ADMIN),
    ApiOperation({
      summary: 'Clear deleted user avatars',
    }),
    ApiOkResponse({ example: 'OK' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Forbidden' }),
    ApiBearerAuth(),
    Throttle({ default: { limit: 10, ttl: 60000 } }),
    Post(),
    HttpCode(HttpStatus.ACCEPTED),
  );
};
