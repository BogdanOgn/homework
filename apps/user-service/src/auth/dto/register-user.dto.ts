import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class RegisterUserDto {
  @ApiProperty({
    default: 'user',
    description: 'user login for register account',
  })
  @IsString()
  login!: string;

  @ApiProperty({
    default: 'user@gmail.com',
    description: 'user email for register account',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    default: 'user123',
    description: 'user password for register account',
  })
  @IsString()
  @MaxLength(128)
  @MinLength(3)
  password!: string;

  @ApiProperty({
    default: 18,
    description: 'user age for register account',
    minimum: 18,
  })
  @IsInt()
  @Min(18)
  age!: number;

  @ApiPropertyOptional({
    default:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Illo, voluptas reprehenderit assumenda quidem labore deserunt!',
    description: 'user optional description for register account',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  aboutDescription?: string;
}
