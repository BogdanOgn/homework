import {
  Body,
  Controller,
  FileTypeValidator,
  ForbiddenException,
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
  ApiAvatarRestore,
  ApiBalanceTransfer,
  ApiBalanceTransferHistory,
} from './decorators/api-user.decorator.js';
import { UsersFiltersDto } from './dto/users-filters.dto.js';
import type {
  IBalanceTransferResponse,
  UserResponse,
  UserUploadAvatarResponse,
} from './types/user.types.js';
import { UserUpdateDto } from './dto/user-update.dto.js';
import { UsersListResponseDto } from './dto/users-list-response.dto.js';
import type { IUploadedMulterFile } from '@providers/files/s3/interfaces/upload-file.interface.js';
import { UserAvatarFilters } from './dto/user-avatar-filters.dto.js';
import { UserActiveFiltersDto } from './dto/user-active-filters.dto.js';
import { UsersListActiveResponseDto } from './dto/users-list-active-response.dto.js';
import { UserBalanceTransferDto } from './dto/user-balance-transfer.dto.js';
import { UserBalanceTransferHistoryFiltersDto } from './dto/user-balance-transfer-history-filters.dto.js';
import { UserBalanceTransferHistoryListResponseDto } from './dto/user-balance-transfer-history-list-response.dto copy.js';
import { IdempotencyKey } from '@common/decorators/idempotency-key.decorator.js';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiFindAll()
  findAll(@Query() filters: UsersFiltersDto): Promise<UsersListResponseDto> {
    const users = this.userService.findMany(filters);

    return users;
  }

  @ApiFindActiveUsers()
  async findActiveUsers(
    @Query() filters: UserActiveFiltersDto,
  ): Promise<UsersListActiveResponseDto> {
    return this.userService.findActiveUsers(filters);
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
    return await this.userService.update(id, dto);
  }

  @ApiMe()
  me(@AuthorizedUserData() user: User): UserResponse {
    return user;
  }

  @ApiAvatarUpload()
  async avatarUpload(
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
    return this.userService.avatarUpload(file, user.id);
  }

  @ApiAvatarDelete()
  async avatarDelete(
    @Param('avatarId') avatarId: string,
    @AuthorizedUserData() user: User,
  ): Promise<string> {
    await this.userService.avatarSoftDelete(avatarId, user.id);

    return 'OK';
  }

  @ApiAvatarRestore()
  async avatarRestore(
    @Param('avatarId') avatarId: string,
    @AuthorizedUserData() user: User,
  ): Promise<UserUploadAvatarResponse> {
    return await this.userService.avatarRestore(avatarId, user.id);
  }

  @ApiAvatarFindAll()
  async avatarFindAll(
    @Query() filters: UserAvatarFilters,
    @Param('userId') userId: string,
  ): Promise<UserUploadAvatarResponse[]> {
    return await this.userService.avatarFindAll(userId, filters);
  }

  @ApiBalanceTransfer()
  async balanceTransfer(
    @Body() dto: UserBalanceTransferDto,
    @AuthorizedUserData('id') userId: string,
    @IdempotencyKey() idempotencyKey: string,
  ): Promise<IBalanceTransferResponse> {
    return this.userService.balanceTransfer(dto, userId, idempotencyKey);
  }

  @ApiBalanceTransferHistory()
  async balanceTransferHistory(
    @Query() filters: UserBalanceTransferHistoryFiltersDto,
    @AuthorizedUserData('id') userId: string,
  ): Promise<UserBalanceTransferHistoryListResponseDto> {
    return await this.userService.balanceTransferHistory(filters, userId);
  }
}
