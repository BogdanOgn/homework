import { Controller, Get, HttpCode, HttpStatus, Logger } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AccessTokenAuthorization } from '../../auth/decorators/authorization.decorator.js';
import { Authorized } from '../../auth/decorators/authorizade.decorator.js';
import type { User } from '../../generated/prisma/client.js';
import { UserResponse } from '../../auth/dto/user.dto.js';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './user.service.js';

@ApiTags('User')
@Controller('user')
export class UserController {
  private readonly logger = new Logger('UserController');
  constructor(private readonly userService: UserService) {}

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
