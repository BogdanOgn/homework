import { Controller, Logger } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authorized } from '../../auth/decorators/authorizade.decorator.js';
import type { User } from '../../generated/prisma/client.js';
import { UserService } from './user.service.js';
import { ApiMe } from './decorators/api-user.decorator.js';

@ApiTags('User')
@Controller('user')
export class UserController {
  private readonly logger = new Logger('UserController');
  constructor(private readonly userService: UserService) {}

  @ApiMe()
  me(@Authorized() user: User): User {
    this.logger.log('[Me]: get current user accout');

    return user;
  }
}
