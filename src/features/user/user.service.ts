import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { UserRepository } from './user.repository.js';
import type {
  ICreateUserData,
  UpdateUserData,
  UserResponse,
  UserResponseWithPassword,
  UserUploadAvatarResponse,
} from './types/user.types.js';
import { UsersFiltersDto } from './dto/users-filters.dto.js';
import { UsersListResponseDto } from './dto/users-list-response.dto.js';
import { TokenService } from '@features/token/token.service.js';
import { UserUpdateDto } from './dto/user-update.dto.js';
import * as bcrypt from 'bcrypt';
import { IUploadedMulterFile } from '@providers/files/s3/interfaces/upload-file.interface.js';
import { ImagesService } from '@features/images/images.service.js';
import { FOLDERS } from '@features/images/enums/folder.enum.js';
import { UserAvatarFilters } from './dto/user-avatar-filters.dto.js';
import { UserActiveFiltersDto } from './dto/user-active-filters.dto.js';
import { UsersListActiveResponseDto } from './dto/users-list-active-response.dto.js';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { UserBalanceTransferDto } from './dto/user-balance-transfer.dto.js';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class UserService {
  private readonly logger = new Logger('UserService');

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly imagesService: ImagesService,
  ) {}

  async create(dto: ICreateUserData): Promise<UserResponse> {
    return this.userRepository.create(dto);
  }

  async findMany(filters: UsersFiltersDto): Promise<UsersListResponseDto> {
    const cacheKey = `users:${JSON.stringify(filters)}`;

    const cached = await this.cache.get<UsersListResponseDto>(cacheKey);

    if (cached) {
      this.logger.log(`[Cache Return]: ${cacheKey}`);

      return cached;
    }

    const users = await this.userRepository.findMany(filters);

    if (users) {
      await this.cache.set(cacheKey, users, 30000);
    }

    this.logger.log(`[Cache Miss]: ${cacheKey}`);
    return users;
  }

  async findByEmail(email: string): Promise<UserResponse | null> {
    return this.userRepository.findByEmail(email);
  }

  async findByLogin(login: string): Promise<UserResponse | null> {
    return this.userRepository.findByLogin(login);
  }

  async findByLoginWithPassword(
    login: string,
  ): Promise<UserResponseWithPassword | null> {
    return this.userRepository.findByLoginWithPassword(login);
  }

  async findById(id: string): Promise<UserResponse | null> {
    return await this.userRepository.findById(id);
  }

  async softDelete(id: string): Promise<string> {
    await this.userRepository.softDelete(id);
    await this.tokenService.deleteManyByUserId(id);
    await this.cache.del(`user:${id}`);

    return 'OK';
  }

  async update(id: string, dto: UserUpdateDto): Promise<UserResponse> {
    const updatedData: UpdateUserData = dto.password
      ? { ...dto, password: await bcrypt.hash(dto.password, 10) }
      : dto;

    const user = await this.userRepository.update(id, updatedData);
    await this.cache.del(`user:${id}`);

    return user;
  }

  async avatarUpload(
    file: IUploadedMulterFile,
    userId: string,
  ): Promise<UserUploadAvatarResponse> {
    const images = await this.userRepository.findAvatarsByUserId(userId);
    if (images.length >= 5) {
      throw new UnprocessableEntityException('Image upload limit exceeded');
    }
    try {
      const { path } = await this.imagesService.uploadImage(
        file,
        FOLDERS.AVATARS,
      );

      const avatar = await this.userRepository.avatarUpload(userId, path);

      return { ...avatar };
    } catch {
      throw new BadGatewayException('The file could not be uploaded');
    }
  }

  async avatarSoftDelete(avatarId: string, userId: string): Promise<string> {
    await this.userRepository.avatarSoftDelete(avatarId, userId);
    return 'OK';
  }

  async avatarRestore(
    avatarId: string,
    userId: string,
  ): Promise<UserUploadAvatarResponse> {
    const images = await this.userRepository.findAvatarsByUserId(userId);
    if (images.length >= 5) {
      throw new UnprocessableEntityException('Image upload limit exceeded');
    }

    const deletedAvatar =
      await this.userRepository.findDeletedAvatarById(avatarId);

    if (!deletedAvatar) {
      throw new NotFoundException('Deleted image not found');
    }

    return await this.userRepository.avatarRestore(avatarId, userId);
  }

  async avatarFindAll(
    userId: string,
    filters: UserAvatarFilters,
  ): Promise<UserUploadAvatarResponse[]> {
    return await this.userRepository.findAvatarsByUserId(userId, filters);
  }

  async findActiveUsers(
    filters: UserActiveFiltersDto,
  ): Promise<UsersListActiveResponseDto> {
    const cacheKey = `activeUsers:${JSON.stringify(filters)}`;

    const cached = await this.cache.get<UsersListActiveResponseDto>(cacheKey);

    if (cached) {
      this.logger.log(`[Cache Return]: ${cacheKey}`);

      return cached;
    }

    const users = await this.userRepository.findActiveUsers(filters);

    if (users) {
      await this.cache.set(cacheKey, users, 30000);
    }
    this.logger.log(`[Cache Miss]: ${cacheKey}`);

    return users;
  }

  async balanceTransfer(transferDto: UserBalanceTransferDto, userId: string) {
    const { recipientId, balance } = transferDto;

    if (userId === recipientId) {
      throw new BadRequestException('Unable to transfer funds to yourself');
    }

    const senderUser = await this.findById(userId);
    const recipientUser = await this.findById(recipientId);

    if (!senderUser) {
      throw new NotFoundException('Sender User not found');
    }

    if (!recipientUser) {
      throw new NotFoundException('Recipient User not found');
    }

    if (+senderUser.balance < balance) {
      throw new BadRequestException('Not enough balance');
    }

    return await this.userRepository.balanceTransfer(
      userId,
      recipientId,
      balance,
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async clearDeletedAvatars(): Promise<void> {
    const avatars = await this.userRepository.findAllDeletedAvatar();
    if (avatars.length) {
      await this.userRepository.clearAllDeletedAvatar();
      await this.imagesService.removeManyImage({ paths: avatars });
    }
  }
}
