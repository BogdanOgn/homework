import { Module } from '@nestjs/common';
import { AvatarCleanupService } from './avatar-cleanup.service.js';
import { AvatarCleanupController } from './avatar-cleanup.controller.js';
import { BullModule } from '@nestjs/bullmq';
import { AvatarsCleanupProcessor } from './avatar-cleanup.processor.js';
import { UserModule } from '@features/user/user.module.js';
import { ImagesModule } from '@features/images/images.module.js';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'avatars',
    }),
    UserModule,
    ImagesModule,
  ],
  controllers: [AvatarCleanupController],
  providers: [AvatarCleanupService, AvatarsCleanupProcessor],
})
export class AvatarCleanupModule {}
