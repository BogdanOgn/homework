import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { SORT_ORDER } from '../enums/sort-order.enum.js';
import { Type } from 'class-transformer';
import { SORT_BY_BALANCE_TRANSFERS } from '../enums/sort-by.enum.js';

export class UserBalanceTransferHistoryFiltersDto {
  @ApiPropertyOptional({
    description: 'Search user by login',
    default: 'user',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Balance transfer sort order',
    default: SORT_ORDER.ASC,
    enum: SORT_ORDER,
  })
  @IsOptional()
  @IsEnum(SORT_ORDER)
  sortOrder?: SORT_ORDER;

  @ApiPropertyOptional({
    description: 'Balance transfer sort by',
    default: SORT_BY_BALANCE_TRANSFERS.CREATED_AT,
    enum: SORT_BY_BALANCE_TRANSFERS,
  })
  @IsOptional()
  @IsEnum(SORT_BY_BALANCE_TRANSFERS)
  sortBy?: SORT_BY_BALANCE_TRANSFERS;

  @ApiPropertyOptional({
    description: 'Min balance transfer ',
    default: 1,
  })
  @IsOptional()
  @IsPositive()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  minBalance?: number;

  @ApiPropertyOptional({
    description: 'Max balance transfer ',
    default: 100,
  })
  @IsOptional()
  @IsPositive()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  maxBalance?: number;

  @ApiPropertyOptional({
    description: 'Current page',
    default: 1,
  })
  @Type(() => Number)
  @IsInt()
  page?: number;

  @ApiPropertyOptional({
    description: 'Page size',
    default: 10,
  })
  @Type(() => Number)
  @IsInt()
  pageSize?: number;
}
