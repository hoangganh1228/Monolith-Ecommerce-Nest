import {
  Column,
  CreateDateColumn,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: true })
  @Index() // Index cho isActive vì hầu hết queries đều filter theo field này
  isActive: boolean;

  @CreateDateColumn()
  @Index() // Index cho createdAt vì thường dùng để sort
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}