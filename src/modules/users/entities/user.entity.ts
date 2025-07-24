import {
  Column,
  Entity,
  OneToMany,
} from 'typeorm';
import { UserRole } from './user-role.entity';
import { UserActivityLog } from './user-activity-log.entity';
import { BaseEntity } from 'src/common/base/base.entity';

@Entity('users')
export class User extends BaseEntity {

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  fullName?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLogin?: Date;

  @OneToMany(() => UserRole, userRole => userRole.user)
  userRoles: UserRole[];

  @OneToMany(() => UserActivityLog, log => log.user)
  activityLogs: UserActivityLog[];
}
