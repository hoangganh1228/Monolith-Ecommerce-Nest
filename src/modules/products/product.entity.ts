import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from 'src/common/base/base.entity';

@Entity('products')
@Index(['categoryId', 'isActive']) // Composite index cho filter thường dùng
@Index(['price', 'isActive']) // Composite index cho price range queries
@Index(['viewCount', 'soldCount', 'isActive']) // Composite index cho popular products
@Index(['createdAt', 'isActive']) // Composite index cho sorting by date
export class Product extends BaseEntity {
  @Column()
  @Index() // Single index cho search by name
  name: string;

  @Column('text', { nullable: true })
  description: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column('int', { default: 0 })
  stock: number;

  @Column({ nullable: true })
  categoryId: number;

  @Column('simple-array', { nullable: true })
  tags: string[];

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  soldCount: number;

  @Column({ nullable: true })
  imageUrl: string;

  // Computed properties
  get isInStock(): boolean {
    return this.stock > 0;
  }

  get isPopular(): boolean {
    return this.viewCount > 100 || this.soldCount > 100;
  }
}
