import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from 'src/common/base/base.entity';
import { Product } from './product.entity';

@Entity('product_images')
export class ProductImage extends BaseEntity {
  @Column()
  productId: number;

  @Column()
  imageUrl: string;

  @Column()
  publicId: string; // Cloudinary public_id for deletion

  @Column({ default: 0 })
  sortOrder: number; // Order of images (0 = thumbnail)

  @Column({ nullable: true })
  altText: string;

  @ManyToOne(() => Product, (product) => product.images, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;

  get isThumbnail(): boolean {
    return this.sortOrder === 0;
  }
}