import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './features/prisma/prisma.module.js';
import { UserModule } from './features/user/user.module.js';
import { TokenModule } from './features/token/token.module.js';
import { ImagesModule } from './features/images/images.module.js';
import { AuthModule } from './auth/auth.module.js';
import { FilesModule } from './providers/files/files.module.js';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { Keyv } from 'keyv';
import { AvatarCleanupModule } from './features/avatar-cleanup/avatar-cleanup.module.js';

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
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.getOrThrow<string>('REDIS_HOST'),
          port: configService.getOrThrow<string>('REDIS_PORT'),
          password: configService.getOrThrow<string>('REDIS_PASSWORD'),
        },
      }),
    }),
    PrismaModule,
    UserModule,
    AuthModule,
    TokenModule,
    FilesModule,
    ImagesModule,
    AvatarCleanupModule,
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
