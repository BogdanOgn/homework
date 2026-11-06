import { Module } from '@nestjs/common';
import { ImagesService } from './images.service.js';
import { FilesModule } from '@providers/files/files.module.js';

@Module({
  imports: [FilesModule],
  providers: [ImagesService],
  exports: [ImagesService],
})
export class ImagesModule {}
