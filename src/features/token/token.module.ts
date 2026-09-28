import { Module } from '@nestjs/common';
import { TokenService } from './token.service.js';
import { JwtModule } from '@nestjs/jwt';
import { TokenRepository } from './token.repository.js';

@Module({
  imports: [JwtModule.register({})],
  providers: [TokenService, TokenRepository],
  exports: [TokenService],
})
export class TokenModule {}
