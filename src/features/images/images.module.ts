import { Module } from '@nestjs/common';
import { ImagesService } from './images.service.js';
import { FilesModule } from '@providers/files/files.module.js';
import { ImagesRepository } from './images.repository.js';

@Module({
  imports: [FilesModule],
  providers: [ImagesService, ImagesRepository],
  exports: [ImagesService],
})
export class ImagesModule {}
