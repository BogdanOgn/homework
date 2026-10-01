import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';
import { UserUploadAvatarResponse } from '../types/user.types.js';
import { UserUploadAvatarResponseDto } from './user-upload-avatar-response.dto.js';

export class UserActiveResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'fe46a3d6-7f2a-41d4-b008-e7b8265c7de8',
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'User login',
    example: 'John Doe',
  })
  @IsString()
  login!: string;

  @ApiProperty({
    description: 'User email',
    example: 'johndoe@gmail.com',
  })
  @IsString()
  email!: string;

  @ApiProperty({
    description: 'User age',
    example: 24,
  })
  @IsInt()
  age!: number;

  @ApiPropertyOptional({
    description: 'User about description',
    example: 'Lorem ipsum dolor sit amet consectetur adipisicing elit...',
  })
  @IsString()
  aboutDescription?: string;

  @ApiProperty({
    description: 'User account created at',
    example: '2026-09-01T13:58:51.326Z',
  })
  @IsString()
  createdAt!: Date;

  @ApiProperty({
    description: 'User account updated at',
    example: '2026-09-01T13:58:51.326Z',
  })
  @IsString()
  updatedAt!: Date;

  @ApiProperty({
    description: 'User account deleted at',
    example: null,
  })
  @IsString()
  deletedAt!: Date | null;

  @ApiProperty({
    description: 'User account avatars',
    type: [UserUploadAvatarResponseDto],
  })
  avatars!: UserUploadAvatarResponse[];
}
