import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto.js';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto.js';
import { UserService } from '../user/user.service.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');
  constructor(private readonly userService: UserService) {}

  async register(dto: RegisterUserDto) {
    const { login, email, password } = dto;
    const existingUserByEmail = await this.userService.findByEmail(email);
    const existingUserByLogin = await this.userService.findByLogin(login);

    const hashedPassword: string = await bcrypt.hash(password, 10);

    if (existingUserByEmail) {
      this.logger.warn(`Failed user register - email '${email}' already exist`);
      throw new ConflictException('User with this email already existing');
    }
    if (existingUserByLogin) {
      this.logger.warn(`Failed user register - login '${login}' already exist`);
      throw new ConflictException('User with this username already existing');
    }

    const userRegisterData = { ...dto, password: hashedPassword };

    const user = await this.userService.create(userRegisterData);

    this.logger.log(`User register - ${user.id}`);
    return user;
  }

  async login(dto: LoginUserDto) {
    const { login, password } = dto;

    if (!login) {
      this.logger.warn(`Failed user login - login is not pass`);
      throw new BadRequestException('Enter your login');
    }

    const user = await this.userService.findByLoginWithPassword(login);

    if (!user) {
      this.logger.warn(`Failed user login for login - '${login}'`);
      throw new UnauthorizedException('Incorrect credentials');
    }

    const verifyPassword = await bcrypt.compare(password, user.password);

    if (!verifyPassword) {
      this.logger.log(`Failed user login - ${user.id}`);
      throw new UnauthorizedException('Incorrect credentials');
    }

    this.logger.log(`User login - ${user.id}`);
    const { password: _, ...findedUser } = user;
    return findedUser;
  }
}
