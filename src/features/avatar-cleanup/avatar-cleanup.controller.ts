import { Controller } from '@nestjs/common';
import { AvatarCleanupService } from './avatar-cleanup.service.js';
import { ApiAvatarCleanup } from './decorators/api-avatar-cleanup.decorator.js';
import { RemovedAvatarsResponse } from './types/avatar.types.js';

@Controller('avatar-cleanup')
export class AvatarCleanupController {
  constructor(private readonly avatarCleanupService: AvatarCleanupService) {}

  @ApiAvatarCleanup()
  async cleanup(): Promise<RemovedAvatarsResponse> {
    return await this.avatarCleanupService.clearDeletedAvatars();
  }
}
