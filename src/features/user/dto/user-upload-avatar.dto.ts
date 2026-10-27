import { ApiProperty } from '@nestjs/swagger';
import type { IUploadedMulterFile } from '@providers/files/s3/interfaces/upload-file.interface.js';

export class UserUploadAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file',
  })
  file!: IUploadedMulterFile;
}
