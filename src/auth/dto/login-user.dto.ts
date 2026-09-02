import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    default: 'user',
    description: 'user login for login into account',
  })
  @IsString()
  login!: string;

  @ApiProperty({
    default: 'user123',
    description: 'user password for login into account',
  })
  @IsString()
  password!: string;
}
