import { ApiProperty } from '@nestjs/swagger';
import type { UserBalanceTransferHistoryResponse } from '../types/user.types.js';
import { UserBalanceTransferHistoryResponseDto } from './user-balance-transfer-history-response.dto.js';

export class UserBalanceTransferHistoryListResponseDto {
  @ApiProperty({
    description: 'history page',
    type: [UserBalanceTransferHistoryResponseDto],
  })
  history!: UserBalanceTransferHistoryResponse[];

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
