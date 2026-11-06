import { Module } from '@nestjs/common';

import { S3Lib } from './constants/do-spaces-service-lib.constant.js';
import { S3Service } from './s3.service.js';
import { ConfigService } from '@nestjs/config';
import { getS3Config } from './config/s3.config.js';

@Module({
  providers: [
    S3Service,
    {
      provide: S3Lib,
      inject: [ConfigService],
      useFactory: getS3Config,
    },
  ],
  exports: [S3Service, S3Lib],
})
export class S3Module {}
