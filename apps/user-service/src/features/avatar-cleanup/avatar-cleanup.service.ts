import { ImagesService } from '@features/images/images.service.js';
import { UserService } from '@features/user/user.service.js';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { RemovedAvatarsResponse } from './types/avatar.types.js';
import { ConfigService } from '@nestjs/config';
import { CronJob } from 'cron';

@Injectable()
export class AvatarCleanupService {
  private readonly AVATARS_DELETE_SIZE: string;
  private readonly AVATARS_CRON_EXPRESSION: string;

  constructor(
    @InjectQueue('avatars') private avatarsQueue: Queue,
    private schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService,
    private readonly userService: UserService,
    private readonly imagesService: ImagesService,
  ) {
    this.AVATARS_DELETE_SIZE = this.configService.getOrThrow<string>(
      'AVATARS_DELETE_SIZE',
    );
    this.AVATARS_CRON_EXPRESSION = this.configService.getOrThrow<string>(
      'AVATARS_CRON_EXPRESSION',
    );
  }

  onModuleInit(): void {
    const job = new CronJob(this.AVATARS_CRON_EXPRESSION, () =>
      this.addCleanupQueue(),
    );

    this.schedulerRegistry.addCronJob('cleanup', job);
    job.start();
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

  async clearDeletedAvatars(): Promise<RemovedAvatarsResponse> {
    let removedAvatars = 0;

    while (true) {
      const avatars = await this.userService.findAllPathsDeletedAvatar(
        +this.AVATARS_DELETE_SIZE,
      );

      if (!avatars.length) break;

      const avatarPaths = avatars.map(({ Key }) => ({ Key }));
      const deletedAvatars = await this.imagesService.removeManyImage({
        paths: avatarPaths,
      });

      if (!deletedAvatars.deleted.length) {
        throw new Error(
          `Failed remove avatars: ${deletedAvatars.failed.length}/${avatars.length} failed`,
        );
      }

      await this.userService.clearAllDeletedAvatar(deletedAvatars.deleted);

      removedAvatars += deletedAvatars.deleted.length;
    }

    return { deletedLength: removedAvatars };
  }
}
