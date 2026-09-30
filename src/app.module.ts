import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './features/prisma/prisma.module.js';
import { UserModule } from './features/user/user.module.js';
import { TokenModule } from './features/token/token.module.js';
import { ImagesModule } from './features/images/images.module.js';
import { AuthModule } from './auth/auth.module.js';
import { FilesModule } from './providers/files/files.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    PrismaModule,
    UserModule,
    AuthModule,
    TokenModule,
    FilesModule,
    ImagesModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
