import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UserUpdateDto {
  @ApiPropertyOptional({
    description: 'user login for update',
    default: 'user',
  })
  @IsOptional()
  @IsString()
  login?: string;

  @ApiPropertyOptional({
    description: 'user email for update',
    default: 'user@gmail.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description: 'user about description for update',
    default:
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Illo, voluptas reprehenderit assumenda quidem labore deserunt!',
  })
  @IsOptional()
  @IsString()
  aboutDescription?: string;

  @ApiPropertyOptional({
    description: 'user password for update',
    default: 'user123',
  })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({
    description: 'user age for update',
    default: 18,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  age?: number;
}
