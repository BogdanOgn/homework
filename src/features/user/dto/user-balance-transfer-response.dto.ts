import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class UserBalanceTransferResponseDto {
  @ApiProperty({
    description: 'Old sender user balance',
    example: '150',
  })
  @IsNumber()
  oldBalance!: number;

  @ApiProperty({
    description: 'New sender user balance',
    example: '99.55',
  })
  @IsNumber()
  newBalance!: number;

  @ApiProperty({
    description: 'Sender user login',
    example: 'user',
  })
  @IsString()
  senderLogin!: string;

  @ApiProperty({
    description: 'Recipient user login',
    example: 'user5',
  })
  @IsString()
  recipientLogin!: string;
}
