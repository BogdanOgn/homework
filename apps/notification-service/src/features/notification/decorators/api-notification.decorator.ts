import { applyDecorators, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';

export const ApiSendNotification = () => {
  return applyDecorators(
    ApiOperation({
      summary: 'Send notification for user',
    }),
    Post('send'),
  );
};
