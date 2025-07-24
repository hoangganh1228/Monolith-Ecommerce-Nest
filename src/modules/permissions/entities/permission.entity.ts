import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Resource } from './resource.entity';
import { RolePermission } from 'src/modules/roles/entities/role-permission.entity';
import { BaseEntity } from 'src/common/base/base.entity';

@Entity('permissions')
export class Permission extends BaseEntity {
  @Column({ name: 'resource_id', type: 'int' })
  resourceId: number;

  @Column({ type: 'varchar', length: 100, nullable: false })
  action: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: RolePermission[];

  @ManyToOne(() => Resource, (resource) => resource.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'resource_id' })
  resource: Resource;

  get fullPermission(): string {
    return `${this.resource.name}:${this.action}`;
  }
}
