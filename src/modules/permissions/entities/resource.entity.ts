import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Permission } from "./permission.entity";

@Entity('resources')
export class Resource {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'varchar', length: 100, nullable: false })
    name: string;

    @Column({ type: 'varchar', length: 200, nullable: true })
    path?: string; // API path or route

    @Column({ type: 'text', nullable: true })
    description?: string;

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @OneToMany(() => Permission, permission => permission.resource)
    permissions: Permission[];
}