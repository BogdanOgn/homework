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
  ApiBadGatewayResponse,
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
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
import { UserBalanceTransferHistoryListResponseDto } from '../dto/user-balance-transfer-history-list-response.dto.js';

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
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
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
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Forbidden access' }),
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
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiForbiddenResponse({ description: 'Forbidden access' }),
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
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiUnprocessableEntityResponse({
      description: 'Image upload limit exceeded',
    }),
    ApiBadGatewayResponse({ description: 'The file could not be uploaded' }),
    ApiCreatedResponse({ type: UserUploadAvatarResponseDto }),
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
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
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
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiUnprocessableEntityResponse({
      description: 'Image upload limit exceeded',
    }),
    ApiNotFoundResponse({
      description: 'Deleted image not found',
    }),
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
    ApiHeader({
      name: 'idempotency-key',
      description: 'Unique idempotency key for balance transfers',
      required: true,
      example: '4f154fc0-3194-4793-a411-1fa3111b8e81',
    }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiBadRequestResponse({
      description: 'Invalid request',
      content: {
        'application/json': {
          examples: {
            idempotencyKeyMissing: {
              summary: 'The Idempotency-Key was not passed',
              value: {
                statusCode: 400,
                message: 'Idempotency key is required',
                error: 'Bad Request',
              },
            },
            selfTransfer: {
              summary: 'Translation to yourself',
              value: {
                statusCode: 400,
                message: 'Unable to transfer funds to yourself',
                error: 'Bad Request',
              },
            },
            notEnoughBalance: {
              summary: 'Insufficient funds',
              value: {
                statusCode: 400,
                message: 'Not enough balance',
                error: 'Bad Request',
              },
            },
          },
        },
      },
    }),
    ApiNotFoundResponse({
      description: 'Not Found',
      content: {
        'application/json': {
          examples: {
            senderUserNotFound: {
              summary: 'Sender User not found',
              value: {
                statusCode: 404,
                message: 'Sender User not found',
                error: 'Not Found',
              },
            },
            recipientUserNotFound: {
              summary: 'Recipient User not found',
              value: {
                statusCode: 404,
                message: 'Recipient User not found',
                error: 'Not Found',
              },
            },
          },
        },
      },
    }),
    ApiConflictResponse({
      description: 'The transaction is currently not possible',
    }),
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
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
    ApiBearerAuth(),
    ApiOkResponse({
      type: UserBalanceTransferHistoryListResponseDto,
    }),
    Get('balance/history'),
    HttpCode(HttpStatus.OK),
  );
};
