import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from '../dto/register-user.dto.js';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from '../dto/login-user.dto.js';
import { UserService } from '@features/user/user.service.js';
import { UserResponse } from '@features/user/types/user.types.js';
import { TokenService } from './token.service.js';
import { ITokenPayload, ITokensResponse } from '../types/token.types.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  constructor(
    private readonly userService: UserService,
    private readonly tokenService: TokenService,
  ) {}

  async register(dto: RegisterUserDto): Promise<ITokensResponse> {
    const { login, email, password } = dto;
    const existingUserByEmail = await this.userService.findByEmail(email);
    const existingUserByLogin = await this.userService.findByLogin(login);

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existingUserByEmail) {
      this.logger.warn(
        `[Register]: Failed user register - email '${email}' already exist`,
      );
      throw new ConflictException('User with this email already existing');
    }
    if (existingUserByLogin) {
      this.logger.warn(
        `[Register]: Failed user register - login '${login}' already exist`,
      );
      throw new ConflictException('User with this username already existing');
    }

    const userRegisterData = { ...dto, password: hashedPassword };

    const user = await this.userService.create(userRegisterData);

    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens(user);

    this.logger.log(`[Register]: User register with id - ${user.id}`);
    return { accessToken: accessToken, refreshToken: refreshToken };
  }

  async login(dto: LoginUserDto): Promise<ITokensResponse> {
    const { login, password } = dto;

    if (!login) {
      this.logger.warn(`[Login]: Failed user login - login is not pass`);
      throw new BadRequestException('Enter your login');
    }

    const user = await this.userService.findByLoginWithPassword(login);

    if (!user) {
      this.logger.warn(`[Login]: Failed user login for login - '${login}'`);
      throw new UnauthorizedException('Incorrect credentials');
    }

    const verifyPassword = await bcrypt.compare(password, user.password);

    if (!verifyPassword) {
      this.logger.log(`[Login]: Failed user login - ${user.id}`);
      throw new UnauthorizedException('Incorrect credentials');
    }

    await this.tokenService.deleteManyByExpires(user.id);

    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens(user);

    this.logger.log(`[Login]: User login with id - ${user.id}`);
    return { accessToken: accessToken, refreshToken: refreshToken };
  }

  async logout(token: string): Promise<string> {
    await this.tokenService.deleteManyByToken(token);
    return 'OK';
  }

  async logoutAll(userId: string): Promise<string> {
    await this.tokenService.deleteManyByUserId(userId);
    return 'OK';
  }

  async refresh(user: ITokenPayload, token: string): Promise<ITokensResponse> {
    await this.tokenService.deleteManyByToken(token);

    const { accessToken, refreshToken } =
      await this.tokenService.generateTokens(user);

    this.logger.log(`[Refresh]: Tokens refreshed for user - ${user.id}`);
    return { accessToken: accessToken, refreshToken: refreshToken };
  }

  async validate(id: string): Promise<UserResponse> {
    const user = await this.userService.findById(id);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }
}
