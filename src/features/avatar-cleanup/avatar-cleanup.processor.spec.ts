import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import type { Job } from 'bullmq';
import { AvatarsCleanupProcessor } from './avatar-cleanup.processor.js';
import { AvatarCleanupService } from './avatar-cleanup.service.js';

const createJob = (name: string): Job => ({ id: '1', name }) as Job;

describe('AvatarsCleanupProcessor', () => {
  let processor: AvatarsCleanupProcessor;
  let avatarCleanupService: AvatarCleanupService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AvatarsCleanupProcessor,
        {
          provide: AvatarCleanupService,
          useValue: {
            clearDeletedAvatars: vi.fn(),
          },
        },
      ],
    }).compile();

    processor = moduleRef.get(AvatarsCleanupProcessor);
    avatarCleanupService = moduleRef.get(AvatarCleanupService);
  });

  describe('process', () => {
    it('clear deleted avatars on cleanup job', async () => {
      vi.mocked(avatarCleanupService.clearDeletedAvatars).mockResolvedValue({
        deletedLength: 3,
      });

      await processor.process(createJob('cleanup'));

      expect(avatarCleanupService.clearDeletedAvatars).toHaveBeenCalledTimes(1);
    });

    it('ignore unknown job', async () => {
      await processor.process(createJob('unknown'));

      expect(avatarCleanupService.clearDeletedAvatars).not.toHaveBeenCalled();
    });

    it('rethrow error to let queue retry job', async () => {
      vi.mocked(avatarCleanupService.clearDeletedAvatars).mockRejectedValue(
        new Error('S3 error'),
      );

      await expect(processor.process(createJob('cleanup'))).rejects.toThrow(
        'S3 error',
      );
    });
  });
});
