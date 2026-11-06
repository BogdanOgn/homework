import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    default: 'user',
    description: 'user login for login into account',
  })
  @IsString()
  @IsNotEmpty()
  login!: string;

  @ApiProperty({
    default: 'user123',
    description: 'user password for login into account',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
