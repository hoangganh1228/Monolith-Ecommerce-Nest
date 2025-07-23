import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Role } from "./role.entity";
import { Permission } from "src/modules/permissions/entities/permission.entity";

@Entity('role_permissions')
export class RolePermission { 
  @PrimaryColumn({ name: 'role_id', type: 'int' })
  roleId: number;

  @PrimaryColumn({ name: 'permission_id', type: 'int' })
  permissionId: number;

  @CreateDateColumn({ type: 'timestamptz' })
  grantedAt: Date;

  @Column({ name: 'granted_by', type: 'bigint', nullable: true })
  grantedBy?: string;

  // Relations
  @ManyToOne(() => Role, role => role.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => Permission, permission => permission.rolePermissions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permission_id' })
  permission: Permission; 

}