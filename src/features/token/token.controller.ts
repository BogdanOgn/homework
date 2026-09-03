import { Controller } from '@nestjs/common';
import { TokenService } from './token.service.js';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}
}
