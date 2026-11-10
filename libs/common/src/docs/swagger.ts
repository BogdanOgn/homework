import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

interface ISwaggerTag {
  name: string;
  description?: string;
}

interface ISwaggerOptions {
  appName: string;
  tags?: ISwaggerTag[];
}

export const setupSwagger = (
  app: INestApplication,
  { appName, tags = [] }: ISwaggerOptions,
): void => {
  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${appName} - Nest Home Work`)
    .setDescription('Documentation for NestJS homework API')
    .setVersion('1.0')
    .addCookieAuth('refreshToken')
    .addBearerAuth();

  if (tags) {
    for (const { name, description } of tags) {
      swaggerConfig.addTag(name, description, undefined, { kind: 'nav' });
    }
  }

  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig.build());

  SwaggerModule.setup('docs', app, documentFactory, {
    jsonDocumentUrl: '/swagger.json',
    yamlDocumentUrl: '/swagger.yaml',
  });
};
