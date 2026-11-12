import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({
    default: '5f684331-94be-4f0c-b439-aa7eea539f64',
    description: 'from user id',
  })
  @IsString()
  fromUserId!: string;

  @ApiProperty({
    default: '55f31f89-7f31-4db2-b621-087097fceaff',
    description: 'to user id',
  })
  @IsString()
  toUserId!: string;

  @ApiProperty({
    default: '50.45',
    description: 'transfer amount',
  })
  @IsString()
  amount!: string;
}
