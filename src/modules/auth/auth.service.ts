import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { Role } from '../roles/entities/role.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { RoleEnum } from 'src/common/enums/role.enum';
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
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

    const savedUser = await this.userRepository.save(user);
    console.log(`Default role for user ${savedUser.email}:`, RoleEnum.USER);
    const defaultRole = await this.roleRepository.findOne({
      where: { name: `${RoleEnum.USER}`,  },
    });
    

    if (!defaultRole) {
      throw new ConflictException('Default role not found');
    }
    const userRole = this.userRoleRepository.create({
      userId: savedUser.id,
      roleId: defaultRole.id,
      assignedAt: new Date(),
      assignedBy: savedUser.id, 
    });

    await this.userRoleRepository.save(userRole);

    return savedUser
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
