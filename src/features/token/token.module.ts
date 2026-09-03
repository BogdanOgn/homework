import { Module } from '@nestjs/common';
import { TokenService } from './token.service.js';
import { TokenController } from './token.controller.js';
import { JwtModule } from '@nestjs/jwt';
import { TokenRepository } from './token.repository.js';

@Module({
  imports: [JwtModule.register({})],
  controllers: [TokenController],
  providers: [TokenService, TokenRepository],
  exports: [TokenService],
})
export class TokenModule {}
