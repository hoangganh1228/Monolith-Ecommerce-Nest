import { Module } from '@nestjs/common';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { RolePermission } from '../roles/entities/role-permission.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from '../roles/entities/role.entity';
import { Resource } from './entities/resource.entity';
import { UserRole } from '../users/entities/user-role.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Permission, Role, Resource, RolePermission, UserRole])],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}
