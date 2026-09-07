import { applyDecorators, UseGuards } from '@nestjs/common';
import { AccessTokenGuard, RefreshTokenGuard } from '../guards/auth.guard.js';

export function AccessTokenAuthorization(): MethodDecorator & ClassDecorator {
  return applyDecorators(UseGuards(AccessTokenGuard));
}

export function RefreshTokenAuthorization(): MethodDecorator & ClassDecorator {
  return applyDecorators(UseGuards(RefreshTokenGuard));
}
