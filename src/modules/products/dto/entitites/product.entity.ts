import { Entity, Column, Index, BeforeInsert, BeforeUpdate, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/base/base.entity';
import { ProductImage } from './product-images.entity';
import { Category } from 'src/modules/categories/entities/categories.entity';

@Entity('products')
@Index(['categoryId', 'isDeleted']) // Composite index cho filter thường dùng
@Index(['price', 'isDeleted']) // Composite index cho price range queries
@Index(['viewCount', 'soldCount', 'isDeleted']) // Composite index cho popular products
@Index(['createdAt', 'isDeleted']) // Composite index cho sorting by date
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column()
  @Index({ unique: true })
  slug: string;

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

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => ProductImage, (image) => image.product, {
    cascade: true,
    eager: true,
  })
  images: ProductImage[];

  @ManyToOne(() => Category, (category) => category.products, {cascade: true})
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  get thumbnailUrl(): string | null {
    const thumbnailImage = this.images?.find(img => img.sortOrder === 0);
    return thumbnailImage?.imageUrl || null;
  }

  // Computed properties
  get isInStock(): boolean {
    return this.stock > 0;
  }

  get isPopular(): boolean {
    return this.viewCount > 100 || this.soldCount > 100;
  }

}
