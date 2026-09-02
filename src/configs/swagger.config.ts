import { DocumentBuilder, OpenAPIObject } from '@nestjs/swagger';

export const getSwaggerConfig = (): Omit<OpenAPIObject, 'paths'> => {
  return new DocumentBuilder()
    .setTitle('Nest Home Work')
    .setDescription('Documentation for NestJS homework API')
    .setVersion('1.0')
    .addTag('Auth', 'User auth operations', undefined, { kind: 'nav' })
    .addCookieAuth('refreshToken')
    .addBearerAuth()
    .build();
};
