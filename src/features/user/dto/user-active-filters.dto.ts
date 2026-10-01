import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional } from 'class-validator';

export class UserActiveFiltersDto {
  @ApiPropertyOptional({
    description: 'User min age',
    default: 18,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minAge?: number;

  @ApiPropertyOptional({ description: 'User max age', default: 34 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxAge?: number;
}
