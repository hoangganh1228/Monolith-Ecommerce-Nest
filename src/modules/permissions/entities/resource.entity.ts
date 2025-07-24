import { Column, Entity, OneToMany } from 'typeorm';
import { Permission } from './permission.entity';
import { BaseEntity } from 'src/common/base/base.entity';

@Entity('resources')
export class Resource extends BaseEntity {
  @Column({ type: 'varchar', length: 100, nullable: false })
  name: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  path?: string; // API path or route

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => Permission, (permission) => permission.resource)
  permissions: Permission[];
}
