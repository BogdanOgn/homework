import { Injectable } from '@nestjs/common';
import { IFileService } from '@providers/files/files.adapter.js';
import { IUploadedMulterFile } from '@providers/files/s3/interfaces/upload-file.interface.js';
import { changeFileName } from './utils/change-file-name.util.js';
import { FOLDERS } from './enums/folder.enum.js';
import { ImagesRepository } from './images.repository.js';

@Injectable()
export class ImagesService {
  constructor(
    private readonly fileService: IFileService,
    private readonly imagesRepository: ImagesRepository,
  ) {}

  async uploadImage(file: IUploadedMulterFile, folder: FOLDERS) {
    const name = changeFileName(file.originalname);

    return await this.fileService.uploadFile({
      file,
      folder,
      name,
    });
  }

  async findImagesByUserId(userId: string) {
    const images = await this.imagesRepository.findImagesByUserId(userId);

    return images;
  }
}
