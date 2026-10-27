import { ObjectIdentifier } from '@aws-sdk/client-s3';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class RemoveManyFilesPayloadDto {
  @ApiProperty({
    example: '/profiles/avatars/123',
    isArray: true,
  })
  @IsArray()
  @IsString()
  @IsNotEmpty()
  readonly paths!: ObjectIdentifier[];
}
