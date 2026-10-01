import {
  Body,
  Controller,
  FileTypeValidator,
  ForbiddenException,
  Logger,
  Param,
  ParseFilePipe,
  Query,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthorizedUserData } from '@auth/decorators/authorized-user-data.decorator.js';
import type { User } from '@generated/prisma/client.js';
import { UserService } from './user.service.js';
import {
  ApiMe,
  ApiFindAll,
  ApiDelete,
  ApiUpdate,
  ApiAvatarUpload,
  ApiAvatarDelete,
  ApiAvatarFindAll,
  ApiFindActiveUsers,
} from './decorators/api-user.decorator.js';
import { UsersFiltersDto } from './dto/users-filters.dto.js';
import type {
  UserResponse,
  UserUploadAvatarResponse,
} from './types/user.types.js';
import { UserUpdateDto } from './dto/user-update.dto.js';
import { UsersListResponseDto } from './dto/users-list-response.dto.js';
import type { IUploadedMulterFile } from '@providers/files/s3/interfaces/upload-file.interface.js';
import { UserAvatarFilters } from './dto/user-avatar-filters.dto.js';
import { UserActiveFiltersDto } from './dto/user-active-filters.dto.js';
import { UsersListActiveResponseDto } from './dto/users-list-active-response.dto.js';

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
    @AuthorizedUserData() user: User,
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
    @AuthorizedUserData() user: User,
  ): Promise<UserResponse> {
    if (user.id !== id) {
      throw new ForbiddenException('Forbidden access');
    }
    this.logger.log(`[Update]: Update user data - ${user.id}`);
    return await this.userService.update(id, dto);
  }

  @ApiAvatarUpload()
  async avatarUpload(
    @Param('userId') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: IUploadedMulterFile,
    @AuthorizedUserData() user: User,
  ): Promise<UserUploadAvatarResponse> {
    if (user.id !== userId) {
      throw new ForbiddenException('Forbidden access');
    }
    this.logger.log(
      `[Avatar Upload]: Upload avatar for user with id - ${user.id}`,
    );
    return this.userService.avatarUpload(file, user.id);
  }

  @ApiAvatarDelete()
  async avatarDelete(
    @Param('userId') userId: string,
    @Param('avatarId') avatarId: string,
    @AuthorizedUserData() user: User,
  ): Promise<string> {
    if (user.id !== userId) {
      throw new ForbiddenException('Forbidden access');
    }
    await this.userService.avatarSoftDelete(avatarId, userId);

    this.logger.log(
      `[Avatar Delete]: Soft delete avatar for user with id - ${user.id}`,
    );
    return 'OK';
  }

  @ApiAvatarFindAll()
  async avatarFindAll(
    @Query() filters: UserAvatarFilters,
    @Param('userId') userId: string,
  ): Promise<UserUploadAvatarResponse[]> {
    this.logger.log(
      `[Avatar Find All]: Find all avatars for user with id - ${userId}`,
    );
    return await this.userService.avatarFindAll(userId, filters);
  }

  @ApiMe()
  me(@AuthorizedUserData() user: User): UserResponse {
    this.logger.log(`[Me]: Get current user accout - ${user.id}`);

    return user;
  }

  @ApiFindActiveUsers()
  async findActiveUsers(
    @Query() filters: UserActiveFiltersDto,
  ): Promise<UsersListActiveResponseDto> {
    this.logger.log('[FindActiveUsers]: Get active users');

    return this.userService.findActiveUsers(filters);
  }
}
