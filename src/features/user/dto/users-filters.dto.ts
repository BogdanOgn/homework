import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class UsersFiltersDto {
  @ApiPropertyOptional({
    description: 'search user by login',
    default: 'user',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'current page',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({
    description: 'page size',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}
