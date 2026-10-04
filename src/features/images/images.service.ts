import { Injectable } from '@nestjs/common';
import { IFileService } from '@providers/files/files.adapter.js';
import { IUploadedMulterFile } from '@providers/files/s3/interfaces/upload-file.interface.js';
import { changeFileName } from './utils/change-file-name.util.js';
import { FOLDERS } from './enums/folder.enum.js';
import { RemoveManyFilesPayloadDto } from '@providers/files/s3/dto/remove-many-files-payload.dto.js';

@Injectable()
export class ImagesService {
  constructor(private readonly fileService: IFileService) {}

  async uploadImage(file: IUploadedMulterFile, folder: FOLDERS) {
    const name = changeFileName(file.originalname);

    return await this.fileService.uploadFile({
      file,
      folder,
      name,
    });
  }

  async removeManyImage(dto: RemoveManyFilesPayloadDto) {
    await this.fileService.removeManyFiles(dto);
  }
}
