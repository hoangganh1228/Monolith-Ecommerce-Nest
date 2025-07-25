import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BaseService } from 'src/common/base/base.service';
import { Role } from './entities/role.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UserRole } from '../users/entities/user-role.entity';
import { CreateRoleDto } from './dtos/create-role.dto';
import { UpdateRoleDto } from './dtos/update-role.dto';
import { AssignRoleDto } from './dtos/assign-role.dto';

@Injectable()
export class RolesService extends BaseService<Role>{
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,

    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,

    private dataSource: DataSource
  ) {
    super(roleRepository)
  }

  async create(createRoleDto: CreateRoleDto) {
    const existingRole = await this.roleRepository.findOne({
      where: { name: createRoleDto.name, isDeleted: true }
    });

    if (existingRole) {
      throw new ConflictException('Role name already exists');
    }

    return super.create(createRoleDto);
  }

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    if(updateRoleDto.name) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: updateRoleDto.name, isDeleted: true }
      });
      
      if (existingRole && existingRole.id !== id) {
        throw new ConflictException('Role name already exists');
      }
    }

    return super.update(id, updateRoleDto);
  }

  async remove(id: number): Promise<void> {
    // Check xem role có đang được sử dụng không
    const userCount = await this.userRoleRepository.count({
      where: { roleId: id }
    });

    if (userCount > 0) {
      // Sử dụng BaseService soft delete
      await super.remove(id);
    } else {
      // Có thể hard delete vì không có reference
      await super.hardDelete(id);
    }
  }

  async assignRoleToUser(assignRoleDto: AssignRoleDto, assignedBy: string) {
    const {userId, roleId} = assignRoleDto;
    
    return await this.dataSource.transaction(async manager => {
      const role = await this.findOne(roleId);

      const existingUserRole = await manager.findOne(UserRole, {
        where: { userId }
      });

      if (existingUserRole) {
        throw new ConflictException('User already has this role');
      }
      const userRole = manager.create(UserRole, {
        userId: Number(userId),
        roleId: Number(roleId),
        assignedBy: Number(assignedBy),
        assignedAt: new Date()
      });

      return await manager.save(UserRole, userRole);
    })
  }
  
  async removeRoleFromUser(userId: number, roleId: number) {
    const userRole = await this.userRoleRepository.findOne({
      where: { userId, roleId }
    });

    if (!userRole) {
      throw new NotFoundException('User role assignment not found');
    }

    await this.userRoleRepository.remove(userRole);

  }

  async getUserByRole(roleId: number) {
    await this.findOne(roleId);

    return await this.userRoleRepository.findOne({
      where: {roleId},
      relations: ['user'],
      order: {assignedAt: 'DESC'}
    })
  }

  async bulkAssignRoles(assignments: AssignRoleDto[], assignedBy: number): Promise<UserRole[]> {
    return await this.dataSource.transaction(async manager => {
      const userRoles: UserRole[] = [];

      for (const assignment of assignments) {
        const { userId, roleId } = assignment;

        // Verify role exists
        await this.findOne(roleId);

        // Check duplicates
        const existing = await manager.findOne(UserRole, {
          where: { userId, roleId }
        });

        if (!existing) {
          const userRole = manager.create(UserRole, {
            userId,
            roleId,
            assignedBy,
            assignedAt: new Date()
          });
          userRoles.push(userRole);
        }
      }

      if (userRoles.length > 0) {
        return await manager.save(UserRole, userRoles);
      }

      return [];
    });
  }

  async findOneWithRelations(id: number) {
    const role = await this.roleRepository.findOne({
      where: {id, isDeleted: true},
      relations: [
        'userRoles',
        'userRoles.user',
        'rolePermissions',
        'rolePermissions.permission'
      ]
    })

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  protected getEntityName(): string {
    return 'Role';
  }

  protected getEntityAlias(): string {
    return 'role';
  }
}
