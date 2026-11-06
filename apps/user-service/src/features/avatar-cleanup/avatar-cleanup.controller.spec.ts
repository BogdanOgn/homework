import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { AvatarCleanupController } from './avatar-cleanup.controller.js';
import { AvatarCleanupService } from './avatar-cleanup.service.js';

describe('AvatarCleanupController', () => {
  let avatarCleanupController: AvatarCleanupController;
  let avatarCleanupService: AvatarCleanupService;

  beforeEach(async () => {
    vi.clearAllMocks();

    const moduleRef = await Test.createTestingModule({
      controllers: [AvatarCleanupController],
      providers: [
        {
          provide: AvatarCleanupService,
          useValue: {
            clearDeletedAvatars: vi.fn(),
          },
        },
      ],
    }).compile();

    avatarCleanupController = moduleRef.get(AvatarCleanupController);
    avatarCleanupService = moduleRef.get(AvatarCleanupService);
  });

  describe('cleanup', () => {
    it('return count of removed avatars', async () => {
      vi.mocked(avatarCleanupService.clearDeletedAvatars).mockResolvedValue({
        deletedLength: 3,
      });

      await expect(avatarCleanupController.cleanup()).resolves.toEqual({
        deletedLength: 3,
      });

      expect(avatarCleanupService.clearDeletedAvatars).toHaveBeenCalledTimes(1);
    });
  });
});
