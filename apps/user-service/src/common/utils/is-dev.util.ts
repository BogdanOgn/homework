import { ConfigService } from '@nestjs/config';

export const isDev = (configService: ConfigService): boolean => {
  return configService.getOrThrow<string>('NODE_ENV') === 'dev';
};
