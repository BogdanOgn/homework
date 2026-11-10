import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { AccessTokenGuard, RefreshTokenGuard } from '../guards/auth.guard.js';
import { RoleGuard } from '@auth/guards/roles.guard.js';
import { ROLE_KEY } from '@auth/constants/role.constant.js';
import { Role } from '@generated/prisma/enums.js';

export function AccessTokenAuthorization(
  ...roles: Role[]
): MethodDecorator & ClassDecorator {
  return applyDecorators(
    SetMetadata(ROLE_KEY, roles),
    UseGuards(AccessTokenGuard, RoleGuard),
  );
}

export function RefreshTokenAuthorization(): MethodDecorator & ClassDecorator {
  return applyDecorators(UseGuards(RefreshTokenGuard));
}
