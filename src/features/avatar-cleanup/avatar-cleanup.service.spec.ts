import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { UserService } from '@features/user/user.service.js';
import { ImagesService } from '@features/images/images.service.js';
import type { deletedAvatarPaths } from '@features/user/types/user.types.js';
import { AvatarCleanupService } from './avatar-cleanup.service.js';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

const config: Record<string, string> = {
  AVATARS_DELETE_SIZE: '2',
  AVATARS_CRON_EXPRESSION: '0 3 * * *',
};

const firstBatch: deletedAvatarPaths[] = [
  { id: 'avatar-1', Key: 'avatars/avatar-1.png' },
  { id: 'avatar-2', Key: 'avatars/avatar-2.png' },
];

const secondBatch: deletedAvatarPaths[] = [
  { id: 'avatar-3', Key: 'avatars/avatar-3.png' },
];

describe('AvatarCleanupService', () => {
  let avatarCleanupService: AvatarCleanupService;
  let avatarsQueue: Queue;
  let userService: UserService;
  let imagesService: ImagesService;
  let schedulerRegistry: SchedulerRegistry;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AvatarCleanupService,
        {
          provide: SchedulerRegistry,
          useValue: { addCronJob: vi.fn() },
        },
        {
          provide: getQueueToken('avatars'),
          useValue: {
            add: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn((key: string) => config[key]),
          },
        },
        {
          provide: UserService,
          useValue: {
            findAllPathsDeletedAvatar: vi.fn(),
            clearAllDeletedAvatar: vi.fn(),
          },
        },
        {
          provide: ImagesService,
          useValue: {
            removeManyImage: vi.fn(),
          },
        },
      ],
    }).compile();

    avatarCleanupService = moduleRef.get(AvatarCleanupService);
    avatarsQueue = moduleRef.get(getQueueToken('avatars'));
    userService = moduleRef.get(UserService);
    imagesService = moduleRef.get(ImagesService);
    schedulerRegistry = moduleRef.get(SchedulerRegistry);
  });

  describe('addCleanupQueue', () => {
    it('add cleanup job to queue with retry options', async () => {
      await avatarCleanupService.addCleanupQueue();

      expect(avatarsQueue.add).toHaveBeenCalledWith(
        'cleanup',
        {},
        {
          deduplication: { id: 'cleanup' },
          attempts: 5,
          backoff: { type: 'exponential', delay: 1_000 },
          removeOnComplete: true,
        },
      );
    });
  });

  describe('onModuleInit', () => {
    it('register cron job with expression from env', () => {
      avatarCleanupService.onModuleInit();

      expect(schedulerRegistry.addCronJob).toHaveBeenCalledTimes(1);

      const [name, job] = vi.mocked(schedulerRegistry.addCronJob).mock.calls[0];

      expect(name).toBe('cleanup');
      expect(job).toBeInstanceOf(CronJob);
      expect(job.cronTime.source).toBe(config.AVATARS_CRON_EXPRESSION);

      void job.stop();
    });
  });

  describe('clearDeletedAvatars', () => {
    it('return zero when there are no deleted avatars', async () => {
      vi.mocked(userService.findAllPathsDeletedAvatar).mockResolvedValue([]);

      await expect(avatarCleanupService.clearDeletedAvatars()).resolves.toEqual(
        { deletedLength: 0 },
      );

      expect(userService.findAllPathsDeletedAvatar).toHaveBeenCalledWith(2);
      expect(imagesService.removeManyImage).not.toHaveBeenCalled();
      expect(userService.clearAllDeletedAvatar).not.toHaveBeenCalled();
    });

    it('remove deleted avatars in batches until none left', async () => {
      vi.mocked(userService.findAllPathsDeletedAvatar)
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce(secondBatch)
        .mockResolvedValueOnce([]);
      vi.mocked(imagesService.removeManyImage)
        .mockResolvedValueOnce({
          deleted: ['avatars/avatar-1.png', 'avatars/avatar-2.png'],
          failed: [],
        })
        .mockResolvedValueOnce({
          deleted: ['avatars/avatar-3.png'],
          failed: [],
        });

      await expect(avatarCleanupService.clearDeletedAvatars()).resolves.toEqual(
        { deletedLength: 3 },
      );

      expect(userService.findAllPathsDeletedAvatar).toHaveBeenCalledTimes(3);
      expect(userService.findAllPathsDeletedAvatar).toHaveBeenCalledWith(2);

      expect(imagesService.removeManyImage).toHaveBeenNthCalledWith(1, {
        paths: [
          { Key: 'avatars/avatar-1.png' },
          { Key: 'avatars/avatar-2.png' },
        ],
      });
      expect(imagesService.removeManyImage).toHaveBeenNthCalledWith(2, {
        paths: [{ Key: 'avatars/avatar-3.png' }],
      });

      expect(userService.clearAllDeletedAvatar).toHaveBeenNthCalledWith(1, [
        'avatars/avatar-1.png',
        'avatars/avatar-2.png',
      ]);
      expect(userService.clearAllDeletedAvatar).toHaveBeenNthCalledWith(2, [
        'avatars/avatar-3.png',
      ]);
    });

    it('clear only avatars whose files were removed from s3', async () => {
      vi.mocked(userService.findAllPathsDeletedAvatar)
        .mockResolvedValueOnce(firstBatch)
        .mockResolvedValueOnce([]);
      vi.mocked(imagesService.removeManyImage).mockResolvedValueOnce({
        deleted: ['avatars/avatar-1.png'],
        failed: ['avatars/avatar-2.png'],
      });

      await expect(avatarCleanupService.clearDeletedAvatars()).resolves.toEqual(
        { deletedLength: 1 },
      );

      expect(userService.clearAllDeletedAvatar).toHaveBeenCalledTimes(1);
      expect(userService.clearAllDeletedAvatar).toHaveBeenCalledWith([
        'avatars/avatar-1.png',
      ]);
    });

    it('throw when no files in batch were removed from s3', async () => {
      vi.mocked(userService.findAllPathsDeletedAvatar).mockResolvedValue(
        firstBatch,
      );
      vi.mocked(imagesService.removeManyImage).mockResolvedValue({
        deleted: [],
        failed: ['avatars/avatar-1.png', 'avatars/avatar-2.png'],
      });

      await expect(
        avatarCleanupService.clearDeletedAvatars(),
      ).rejects.toThrow();

      expect(imagesService.removeManyImage).toHaveBeenCalledTimes(1);
      expect(userService.clearAllDeletedAvatar).not.toHaveBeenCalled();
    });

    it('not clear avatars in db when files removal failed', async () => {
      vi.mocked(userService.findAllPathsDeletedAvatar).mockResolvedValue(
        firstBatch,
      );
      vi.mocked(imagesService.removeManyImage).mockRejectedValue(
        new Error('S3 error'),
      );

      await expect(avatarCleanupService.clearDeletedAvatars()).rejects.toThrow(
        'S3 error',
      );

      expect(userService.clearAllDeletedAvatar).not.toHaveBeenCalled();
    });
  });
});
