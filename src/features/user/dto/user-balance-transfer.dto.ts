import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class UserBalanceTransferDto {
  @ApiProperty({
    description: 'User account balance',
    example: 50.45,
  })
  @IsPositive()
  @IsNumber({ maxDecimalPlaces: 2 })
  balance!: number;

  @ApiProperty({
    description: 'Recipient user id',
    example: '5f684331-94be-4f0c-b439-aa7eea539f64',
  })
  @IsString()
  @IsNotEmpty()
  recipientId!: string;
}
