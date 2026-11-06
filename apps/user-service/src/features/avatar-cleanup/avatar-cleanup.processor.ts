import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AvatarCleanupService } from './avatar-cleanup.service.js';
import { Logger } from '@nestjs/common';

@Processor('avatars')
export class AvatarsCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(AvatarsCleanupProcessor.name);

  constructor(private readonly avatarCleanupService: AvatarCleanupService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name === 'cleanup') {
      await this.avatarCleanupService.clearDeletedAvatars();
    }
  }

  @OnWorkerEvent('active')
  onActive(job: Job): void {
    this.logger.log(`Started ${job.name} #${job.id}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.log(`Completed ${job.name} #${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, err: Error): void {
    this.logger.error(
      `Failed ${job.name} #${job.id} (attempt ${job.attemptsMade}): ${err.message}`,
    );
  }
}
