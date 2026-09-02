import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString } from 'class-validator';

export class UserResponse {
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
    example: 'johndoe.gmail.com',
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
}
