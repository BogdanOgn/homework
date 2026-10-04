import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './features/prisma/prisma.module.js';
import { UserModule } from './features/user/user.module.js';
import { TokenModule } from './features/token/token.module.js';
import { ImagesModule } from './features/images/images.module.js';
import { AuthModule } from './auth/auth.module.js';
import { FilesModule } from './providers/files/files.module.js';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        stores: [
          new Keyv({
            store: new KeyvRedis({
              url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
              password: process.env.REDIS_PASSWORD,
            }),
          }),
        ],
        ttl: 30000,
      }),
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    ScheduleModule.forRoot(),
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
