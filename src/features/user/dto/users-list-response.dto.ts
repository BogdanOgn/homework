import { ApiProperty } from '@nestjs/swagger';
import type { PublicUserResponseWithAvatars } from '../types/user.types.js';
import { UserActiveResponseDto } from './user-active-response.dto.js';

export class UsersListResponseDto {
  @ApiProperty({
    description: 'users page',
    type: [UserActiveResponseDto],
  })
  users!: PublicUserResponseWithAvatars[];

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
