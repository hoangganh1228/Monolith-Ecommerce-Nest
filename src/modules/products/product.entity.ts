import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('products')
@Index(['categoryId', 'isActive'])
@Index(['price', 'isActive'])
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  name: string;

  @Column()
  description: string;

  @Column('decimal')
  price: number;

  @Column('int', { default: 0 })
  stock: number;

  @Column({ default: true })
  @Index()
  isActive: boolean;

  @Column({ nullable: true })
  categoryId: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  soldCount: number;

  @Column({ nullable: true })
  imageUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  get isInStock(): boolean {
    return this.stock > 0;
  }

  get isPopular(): boolean {
    return this.viewCount > 100 || this.soldCount > 100;
  }
}
