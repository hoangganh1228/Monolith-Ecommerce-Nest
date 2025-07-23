import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findOne(id: number) {
    return await this.userRepository.findOne({
      where: { id },
      select: ['id', 'email'], // liệt kê các trường muốn lấy
    });
  }

  async findAll() {
    return await this.userRepository.find();
  }

  async remove(id: number) {
    return await this.userRepository.delete(id);
  }
}
