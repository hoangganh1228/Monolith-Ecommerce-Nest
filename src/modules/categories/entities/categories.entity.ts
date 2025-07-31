import { Entity, Column, OneToMany, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from 'src/common/base/base.entity';
import { Product } from 'src/modules/products/dto/entitites/product.entity';

@Entity('categories')
@Index(['parentId', 'isDeleted']) // Dễ filter sub-category
@Index(['slug'], { unique: true }) // Dễ SEO
export class Category extends BaseEntity {
  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  parentId: number; // Hỗ trợ danh mục cha - con

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  thumbnail: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];
}
