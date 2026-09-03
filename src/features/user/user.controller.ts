import { Controller, Logger, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authorized } from '@auth/decorators/authorizade.decorator.js';
import type { User } from '@generated/prisma/client.js';
import { UserService } from './user.service.js';
import { ApiMe, ApiFindAll } from './decorators/api-user.decorator.js';
import { UsersFiltersDto } from './dto/users-filters.dto.js';
import { IUsersListResponse } from './types/user.types.js';

@ApiTags('User')
@Controller('user')
export class UserController {
  private readonly logger = new Logger('UserController');
  constructor(private readonly userService: UserService) {}

  @ApiFindAll()
  findAll(@Query() filters: UsersFiltersDto): Promise<IUsersListResponse> {
    this.logger.log('[FindAll]: get users list');
    const users = this.userService.findMany(filters);
    return users;
  }

  @ApiMe()
  me(@Authorized() user: User): User {
    this.logger.log('[Me]: get current user accout');

    return user;
  }
}
