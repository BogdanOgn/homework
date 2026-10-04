import {
  applyDecorators,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AccessTokenAuthorization } from '@auth/decorators/authorization.decorator.js';
import { UserResponseDto } from '@features/user/dto/user-response.dto.js';
import { UsersListResponseDto } from '../dto/users-list-response.dto.js';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserUploadAvatarResponseDto } from '../dto/user-upload-avatar-response.dto.js';
import { UserUploadAvatarDto } from '../dto/user-upload-avatar.dto.js';
import { UsersListActiveResponseDto } from '../dto/users-list-active-response.dto.js';
import { UserBalanceTransferResponseDto } from '../dto/user-balance-transfer-response.dto.js';
import { UserBalanceTransferHistoryListResponseDto } from '../dto/user-balance-transfer-history-list-response.dto copy.js';

export const ApiMe = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Get current user',
    }),
    ApiOkResponse({ type: UserResponseDto }),
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
    ApiOkResponse({ type: UsersListResponseDto }),
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

export const ApiUpdate = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Update user',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorization' }),
    ApiOkResponse({ type: UserResponseDto }),
    ApiBearerAuth(),
    Throttle({ default: { limit: 10, ttl: 60000 } }),
    Patch(':id'),
    HttpCode(HttpStatus.OK),
  );
};

export const ApiAvatarUpload = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Upload user avatar',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorization' }),
    ApiOkResponse({ type: UserUploadAvatarResponseDto }),
    UseInterceptors(
      FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
    ),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      type: UserUploadAvatarDto,
    }),
    ApiBearerAuth(),
    Throttle({ default: { limit: 3, ttl: 60000 } }),
    Post('/avatar'),
    HttpCode(HttpStatus.CREATED),
  );
};

export const ApiAvatarDelete = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Soft delete user avatar',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorization' }),
    ApiOkResponse({
      description: 'Avatar soft deleted',
      schema: { type: 'string', example: 'OK' },
    }),
    ApiBearerAuth(),
    Delete('/avatar/:avatarId'),
    HttpCode(HttpStatus.OK),
  );
};

export const ApiAvatarRestore = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Restore user avatar',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorization' }),
    ApiOkResponse({
      description: 'Avatar resotre',
      type: UserUploadAvatarResponseDto,
    }),
    ApiBearerAuth(),
    Patch('/avatar/:avatarId'),
    HttpCode(HttpStatus.OK),
  );
};

export const ApiAvatarFindAll = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all user avatars',
    }),
    ApiOkResponse({
      type: UserUploadAvatarResponseDto,
      isArray: true,
    }),
    Get(':userId/avatars'),
    HttpCode(HttpStatus.OK),
  );
};

export const ApiFindActiveUsers = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Get all active users',
    }),
    ApiOkResponse({
      type: UsersListActiveResponseDto,
      isArray: true,
    }),
    Get('/active'),
    HttpCode(HttpStatus.OK),
  );
};

export const ApiBalanceTransfer = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'Transfer user balance',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorization' }),
    ApiBearerAuth(),
    ApiOkResponse({
      type: UserBalanceTransferResponseDto,
    }),
    Post('balance/transfer'),
    HttpCode(HttpStatus.OK),
  );
};

export const ApiBalanceTransferHistory = () => {
  return applyDecorators(
    AccessTokenAuthorization(),
    ApiOperation({
      summary: 'User Transfer balance history',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorization' }),
    ApiBearerAuth(),
    ApiOkResponse({
      type: UserBalanceTransferHistoryListResponseDto,
    }),
    Get('balance/history'),
    HttpCode(HttpStatus.OK),
  );
};
