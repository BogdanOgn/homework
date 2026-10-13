import * as AWS from '@aws-sdk/client-s3';

import { ConfigService } from '@nestjs/config';

export function getS3Config(config: ConfigService) {
  return new AWS.S3({
    endpoint: config.getOrThrow<string>('S3_ENDPOINT'),
    region: config.getOrThrow<string>('S3_REGION'),
    credentials: {
      accessKeyId: config.getOrThrow<string>('S3_ACCESS_KEY_ID'),
      secretAccessKey: config.getOrThrow<string>('S3_SECRET_ACCESS_KEY'),
    },
  });
}
