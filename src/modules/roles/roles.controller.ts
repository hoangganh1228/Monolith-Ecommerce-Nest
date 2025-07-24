import { Body, Controller, Delete, Get, HttpStatus, Param, ParseIntPipe, Patch, Post, Put, Request, UseGuards } from '@nestjs/common';
import { BaseController } from 'src/common/base/base.controller';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { BulkAssignRolesDto } from './dtos/bulk-assign-roles.dto';
import { AssignRoleDto } from './dtos/assign-role.dto';
import { RoleEnum } from 'src/common/enums/role.enum';

@Controller('/admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN)
export class RolesController extends BaseController<Role, CreateRoleDto, UpdateRoleDto>{
  constructor(protected readonly rolesService: RolesService) {
    super(rolesService)
  }

  @Post()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<Role> {
    return super.create(createRoleDto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto
  ) {
    return super.update(id, updateRoleDto);
  }

  // Override delete để add role guard
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return super.remove(id);
  }

  // Custom endpoints cho role management
  @Get(':id/details')
  async findOneWithRelations(@Param('id', ParseIntPipe) id: number) {
    const role = await this.rolesService.findOneWithRelations(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Role details retrieved successfully',
      data: role
    };
  }

  @Post('assign')
  async assignRole(
    @Body() assignRoleDto: AssignRoleDto,
    @Request() req: any
  ) {
    console.log(req.user.userId);
    const userRole = await this.rolesService.assignRoleToUser(
      assignRoleDto,
      req.user.userId
    );
    
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Role assigned successfully',
      data: userRole
    };
  }

  @Delete('assign/:userId/:roleId')
  async removeRoleFromUser(
    @Param('userId') userId: number,
    @Param('roleId', ParseIntPipe) roleId: number
  ) {
    await this.rolesService.removeRoleFromUser(userId, roleId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Role removed from user successfully'
    };
  }

  @Get(':id/users')
  async getUsersByRole(@Param('id', ParseIntPipe) roleId: number) {
    const userRoles = await this.rolesService.getUserByRole(roleId);
    return {
      statusCode: HttpStatus.OK,
      message: 'Users retrieved successfully',
      data: userRoles
    };
  }

  @Post('bulk-assign')
  async bulkAssignRoles(
    @Body() bulkAssignDto: BulkAssignRolesDto,
    @Request() req: any
  ) {
    const userRoles = await this.rolesService.bulkAssignRoles(
      bulkAssignDto.assignments,
      req.user.userId
    );
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Roles assigned successfully',
      data: userRoles
    };
  }
}
