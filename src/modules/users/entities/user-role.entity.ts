import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./user.entity";
import { Role } from "src/modules/roles/entities/role.entity";

@Entity('user_roles')
export class UserRole {
  @PrimaryColumn({ name: 'user_id', type: 'bigint' })
  userId: number;

  @PrimaryColumn({ name: 'role_id' })
  roleId: number;

  @CreateDateColumn({ type: 'timestamptz' })
  assignedAt: Date;

  @Column({ name: 'assigned_by', type: 'bigint', nullable: true })
  assignedBy?: number;

  @ManyToOne(() => User)
  @JoinColumn({name: 'user_id'})
  user: User

  @ManyToOne(() => Role) 
  @JoinColumn({name: 'role_id'})
  role: Role
}