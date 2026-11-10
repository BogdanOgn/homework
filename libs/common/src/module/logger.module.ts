import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ClsService } from 'nestjs-cls';
import { SerializedRequest, SerializedResponse } from 'pino-std-serializers';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ClsService],
      useFactory: (clsService: ClsService) => ({
        pinoHttp: {
          genReqId: () => clsService.getId(),
          quietReqLogger: true,
          transport: {
            target: 'pino-pretty',
          },
          serializers: {
            req: (req: SerializedRequest) => {
              const { cookie: _c, authorization: _a, ...headers } = req.headers;

              return {
                id: req.id,
                method: req.method,
                url: req.url,
                query: req.query,
                headers,
              };
            },
            res: (res: SerializedResponse) => {
              const { 'set-cookie': _, ...headers } = res.headers;

              return {
                statusCode: res.statusCode,
                headers,
              };
            },
          },
        },
      }),
    }),
  ],
})
export class AppLoggerModule {}
