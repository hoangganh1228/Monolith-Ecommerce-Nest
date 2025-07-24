import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('/profile')
  getMe(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get('/')
  @Roles(RoleEnum.ADMIN)
  findAll(@Request() req) {
    console.log(req.user);
    return this.usersService.findAll();
  }

  @Delete(':id')
  @Roles(RoleEnum.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
