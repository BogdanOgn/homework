import { ImagesService } from '@features/images/images.service.js';
import { UserService } from '@features/user/user.service.js';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { RemovedAvatarsResponse } from './types/avatar.types.js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AvatarCleanupService {
  private readonly AVATARS_DELETE_SIZE: string;

  constructor(
    @InjectQueue('avatars') private avatarsQueue: Queue,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly imagesService: ImagesService,
  ) {
    this.AVATARS_DELETE_SIZE = this.configService.getOrThrow<string>(
      'AVATARS_DELETE_SIZE',
    );
  }

  async addCleanupQueue(): Promise<void> {
    await this.avatarsQueue.add(
      'cleanup',
      {},
      {
        attempts: 5,
        backoff: { type: 'exponential', delay: 1_000 },
        removeOnComplete: true,
      },
    );
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cronCleanup(): Promise<void> {
    await this.addCleanupQueue();
  }

  async clearDeletedAvatars(): Promise<RemovedAvatarsResponse> {
    let removedAvatars = 0;

    while (true) {
      const avatars = await this.userService.findAllPathsDeletedAvatar(
        +this.AVATARS_DELETE_SIZE,
      );

      if (!avatars.length) break;

      const avatarPaths = avatars.map(({ Key }) => ({ Key }));
      await this.imagesService.removeManyImage({ paths: avatarPaths });

      const avatarIds = avatars.map(({ id }) => id);
      await this.userService.clearAllDeletedAvatar(avatarIds);

      removedAvatars += avatars.length;
    }

    return { deletedLength: removedAvatars };
  }
}
