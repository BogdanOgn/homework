import {
  BadGatewayException,
  Injectable,
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

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly tokenService: TokenService,
    private readonly imagesService: ImagesService,
  ) {}

  async create(dto: ICreateUserData): Promise<UserResponse> {
    return this.userRepository.create(dto);
  }

  async findMany(filters: UsersFiltersDto): Promise<UsersListResponseDto> {
    return this.userRepository.findMany(filters);
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

    return 'OK';
  }

  async update(id: string, dto: UserUpdateDto): Promise<UserResponse> {
    const updatedData: UpdateUserData = dto.password
      ? { ...dto, password: await bcrypt.hash(dto.password, 10) }
      : dto;

    return await this.userRepository.update(id, updatedData);
  }

  async avatarUpload(
    file: IUploadedMulterFile,
    userId: string,
  ): Promise<UserUploadAvatarResponse> {
    const images = await this.imagesService.findImagesByUserId(userId);
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
}
