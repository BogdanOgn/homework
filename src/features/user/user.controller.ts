import {
  Body,
  Controller,
  ForbiddenException,
  Logger,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Authorized } from '@auth/decorators/authorizade.decorator.js';
import type { User } from '@generated/prisma/client.js';
import { UserService } from './user.service.js';
import {
  ApiMe,
  ApiFindAll,
  ApiDelete,
  ApiUpdate,
} from './decorators/api-user.decorator.js';
import { UsersFiltersDto } from './dto/users-filters.dto.js';
import { UserResponse } from './types/user.types.js';
import { UserUpdateDto } from './dto/user-update.dto.js';
import { UsersListResponseDto } from './dto/users-list-response.dto.js';

@ApiTags('User')
@Controller('user')
export class UserController {
  private readonly logger = new Logger('UserController');
  constructor(private readonly userService: UserService) {}

  @ApiFindAll()
  findAll(@Query() filters: UsersFiltersDto): Promise<UsersListResponseDto> {
    const users = this.userService.findMany(filters);
    this.logger.log('[FindAll]: Get users list');
    return users;
  }

  @ApiDelete()
  async delete(
    @Param('id') id: string,
    @Authorized() user: User,
  ): Promise<string> {
    if (user.id !== id) {
      throw new ForbiddenException('Forbidden access');
    }
    await this.userService.softDelete(id);
    this.logger.log(`[SoftDelete]: Soft delete user - ${user.id}`);
    return 'OK';
  }

  @ApiUpdate()
  async update(
    @Param('id') id: string,
    @Body() dto: UserUpdateDto,
    @Authorized() user: User,
  ): Promise<UserResponse> {
    if (user.id !== id) {
      throw new ForbiddenException('Forbidden access');
    }
    this.logger.log(`[Update]: Update user data - ${user.id}`);
    return await this.userService.update(id, dto);
  }

  @ApiMe()
  me(@Authorized() user: User): User {
    this.logger.log(`[Me]: Get current user accout - ${user.id}`);

    return user;
  }
}
