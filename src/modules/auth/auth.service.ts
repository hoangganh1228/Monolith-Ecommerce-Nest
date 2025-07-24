import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const exist = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (exist) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: ['userRoles', 'userRoles.role'],
    });
    
    const role =  user!.userRoles[0].role || 'User'

    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;

      return { ...result, role };
    }
    throw new UnauthorizedException('Email or password is incorrect.');
  }

  async login(user: any) {
    // Thêm parameter user
    const payload = { email: user.email, sub: user.id, role: user.role.name };
    
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
