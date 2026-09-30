import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDate, IsString } from 'class-validator';

export class UserUploadAvatarResponseDto {
  @ApiProperty({
    description: 'Image ID',
    example: 'f56790a6-f0ed-46bf-b638-045d09375152',
  })
  @IsString()
  id!: string;

  @ApiProperty({
    description: 'User ID',
    example: '55f31f89-7f31-4db2-b621-087097fceaff',
  })
  @IsString()
  userId!: string;

  @ApiProperty({
    description: 'Image ID',
    example: '55f31f89-7f31-4db2-b621-087097fceaff',
  })
  @IsString()
  path!: string;

  @ApiProperty({
    description: 'Image created at',
    example: '2026-09-29T19:14:15.050Z',
  })
  @IsDate()
  createdAt!: Date;

  @ApiPropertyOptional({
    description: 'Image deleted at',
    example: '2026-10-29T19:14:15.050Z',
  })
  @IsDate()
  deletedAt?: Date;
}
