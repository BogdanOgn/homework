import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, IsString, IsUUID } from 'class-validator';

export class UserBalanceTransferHistoryResponseDto {
  @ApiProperty({
    description: 'Transfer id',
    example: '3a855a70-d55c-467e-aa43-e45e583f2345',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({
    description: 'Sender id',
    example: '55f31f89-7f31-4db2-b621-087097fceaff',
  })
  @IsUUID()
  senderId!: string;

  @ApiProperty({
    description: 'Sender login',
    example: 'user',
  })
  @IsString()
  senderLogin!: string;

  @ApiProperty({
    description: 'Recipient id',
    example: '5f684331-94be-4f0c-b439-aa7eea539f64',
  })
  @IsUUID()
  recipientId!: string;

  @ApiProperty({
    description: 'Recipient login',
    example: 'user5',
  })
  @IsString()
  recipientLogin!: string;

  @ApiProperty({
    description: 'Transfer balance',
    example: '50.45',
  })
  @IsPositive()
  @IsNumber({ maxDecimalPlaces: 2 })
  sendedBalance!: number;
}
