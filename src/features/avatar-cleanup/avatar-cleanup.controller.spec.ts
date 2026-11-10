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
            addCleanupQueue: vi.fn(),
          },
        },
      ],
    }).compile();

    avatarCleanupController = moduleRef.get(AvatarCleanupController);
    avatarCleanupService = moduleRef.get(AvatarCleanupService);
  });

  describe('cleanup', () => {
    it('add cleanup job to queue', async () => {
      vi.mocked(avatarCleanupService.addCleanupQueue).mockResolvedValue();

      await expect(avatarCleanupController.cleanup()).resolves.toBeUndefined();

      expect(avatarCleanupService.addCleanupQueue).toHaveBeenCalledTimes(1);
    });
  });
});
