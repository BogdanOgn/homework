import { Module } from '@nestjs/common';
import { PrismaModule } from './features/prisma/prisma.module.js';
import { UserModule } from './features/user/user.module.js';
import { AuthModule } from './features/auth/auth.module.js';

@Module({
  imports: [PrismaModule, UserModule, AuthModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
