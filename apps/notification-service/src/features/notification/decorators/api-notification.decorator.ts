import { AccessTokenAuthorization, Role } from '@app/common';
import { applyDecorators, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

export const ApiSendNotification = () => {
  return applyDecorators(
    AccessTokenAuthorization(Role.ADMIN),
    ApiOperation({
      summary: 'Send notification for user',
    }),
    ApiBearerAuth(),
    Post('send'),
  );
};
