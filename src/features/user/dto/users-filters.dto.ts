import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';
import { SORT_ORDER } from '../enums/sort-order.enum.js';
import { SORT_BY } from '../enums/sort-by.enum.js';

export class UsersFiltersDto {
  @ApiPropertyOptional({
    description: 'search user by login',
    default: 'user',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'user sort order',
    default: SORT_ORDER.ASC,
    enum: SORT_ORDER,
  })
  @IsOptional()
  @IsEnum(SORT_ORDER)
  sortOrder?: SORT_ORDER;

  @ApiPropertyOptional({
    description: 'user sort by',
    default: SORT_BY.LOGIN,
    enum: SORT_BY,
  })
  @IsOptional()
  @IsEnum(SORT_BY)
  sortBy?: SORT_BY;

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
