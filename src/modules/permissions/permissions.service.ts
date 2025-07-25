import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { DataSource, Repository } from 'typeorm';
import { Role } from '../roles/entities/role.entity';
import { Resource } from './entities/resource.entity';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { RoleBasedPermissionDto } from './dtos/assign-permission.dto';
import { UserRole } from '../users/entities/user-role.entity';

@Injectable()
export class PermissionsService {
  constructor(
      @InjectRepository(Permission)
      private readonly permissionRepository: Repository<Permission>,
      @InjectRepository(Role)
      private readonly roleRepository: Repository<Role>,
      @InjectRepository(Resource)
      private readonly resourceRepository: Repository<Resource>,
      @InjectRepository(RolePermission)
      private readonly rolePermissionRepository: Repository<RolePermission>,
      @InjectRepository(UserRole)
      private readonly userRoleRepository: Repository<UserRole>,
  ) {}

  async assignPermissionsToRoles(dtos: RoleBasedPermissionDto[], grantedBy: number) {
    for (const dto of dtos) {
      const { resource, roles } = dto;

      let resourceEntity = await this.resourceRepository.findOneBy({ name: resource });
      if (!resourceEntity) {
        resourceEntity = await this.resourceRepository.save(
          this.resourceRepository.create({ name: resource }),
        );
      }
      for (const { name: roleName, actions } of roles) {
        const roleEntity = await this.roleRepository.findOneBy({ name: roleName });
        if (!roleEntity) continue;

        for (const action of actions) {
          let permission = await this.permissionRepository.findOne({
            where: { resourceId: resourceEntity.id, action },
          });

          if (!permission) {
            permission = await this.permissionRepository.save(
              this.permissionRepository.create({
                resourceId: resourceEntity.id,
                action,
                code: `${resource}:${action}`,
                description: `Permission for ${resource} to perform ${action}`,
              }),
            );
          }

          const exists = await this.rolePermissionRepository.findOneBy({
            roleId: roleEntity.id,
            permissionId: permission.id,
          });

          if (!exists) {
            await this.rolePermissionRepository.save(
              this.rolePermissionRepository.create({
                roleId: roleEntity.id,
                permissionId: permission.id,
                grantedBy,
                grantedAt: new Date(),
              }),
            );
          }
        }
      }
    }
    return { message: 'Permissions assigned successfully for all resources.' };
  }

  async userHasPermission(userId: number, code: string): Promise<boolean> {
    const user = await this.userRoleRepository.findOne({
      where: { userId },
      relations: ['role', 'role.rolePermissions', 'role.rolePermissions.permission'],
    });
    if (!user) return false;

    for (const rolePermission of user.role.rolePermissions) {
      if (rolePermission.permission.code === code) return true;
    }

    return false;
  }
}