import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { UserRepository } from './user.repository.js';
import { TokenModule } from '@features/token/token.module.js';
import { ImagesModule } from '@features/images/images.module.js';
import { FilesModule } from '@providers/files/files.module.js';

@Module({
  imports: [TokenModule, ImagesModule, FilesModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],
})
export class UserModule {}
