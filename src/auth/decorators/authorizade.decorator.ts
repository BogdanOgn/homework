import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '@features/user/types/user.types.js';
import { Request } from 'express';

interface IRequestWithUser extends Request {
  user?: RequestUser;
}

export const Authorized = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<IRequestWithUser>();

    const user = request.user;

    return data ? user![data] : user;
  },
);
