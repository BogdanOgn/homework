import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import type { Queue } from 'bullmq';
import { UserService } from '@features/user/user.service.js';
import { ImagesService } from '@features/images/images.service.js';
import type { deletedAvatarPaths } from '@features/user/types/user.types.js';
import { AvatarCleanupService } from './avatar-cleanup.service.js';

const avatarsDeleteSize = '2';

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

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AvatarCleanupService,
        {
          provide: getQueueToken('avatars'),
          useValue: {
            add: vi.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: vi.fn().mockReturnValue(avatarsDeleteSize),
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
  });

  describe('addCleanupQueue', () => {
    it('add cleanup job to queue with retry options', async () => {
      await avatarCleanupService.addCleanupQueue();

      expect(avatarsQueue.add).toHaveBeenCalledWith(
        'cleanup',
        {},
        {
          attempts: 5,
          backoff: { type: 'exponential', delay: 1_000 },
          removeOnComplete: true,
        },
      );
    });
  });

  describe('cronCleanup', () => {
    it('add cleanup job to queue', async () => {
      await avatarCleanupService.cronCleanup();

      expect(avatarsQueue.add).toHaveBeenCalledTimes(1);
      expect(avatarsQueue.add).toHaveBeenCalledWith(
        'cleanup',
        {},
        expect.any(Object),
      );
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
        'avatar-1',
        'avatar-2',
      ]);
      expect(userService.clearAllDeletedAvatar).toHaveBeenNthCalledWith(2, [
        'avatar-3',
      ]);
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
