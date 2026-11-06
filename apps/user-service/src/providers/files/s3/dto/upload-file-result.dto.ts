import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadFileResultDto {
  @ApiProperty({
    example: '/main/avatars/3fe55edf-6f91-4267-aea1-17caa185aaed.jpg',
  })
  @IsString()
  @IsNotEmpty()
  readonly path!: string;

  @ApiProperty({
    example: '3fe55edf-6f91-4267-aea1-17caa185aaed.jpg',
  })
  @IsString()
  @IsNotEmpty()
  readonly fileName!: string;
}
