import { ApiProperty } from '@nestjs/swagger';
import { UserResponse as UserResponseDto } from '@auth/dto/user.dto.js';
import type { UserResponse } from '../types/user.types.js';

export class UsersListResponse {
  @ApiProperty({
    description: 'users page',
    type: [UserResponseDto],
  })
  users!: UserResponse[];

  @ApiProperty({
    description: 'total users matched by filters',
    example: 42,
  })
  total!: number;

  @ApiProperty({
    description: 'page size',
    example: 10,
  })
  pageSize!: number;

  @ApiProperty({
    description: 'current page',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'total pages count',
    example: 5,
  })
  pages!: number;
}
