import { Entity, Column, OneToMany, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from 'src/common/base/base.entity';
import { Product } from 'src/modules/products/dto/entitites/product.entity';
import { MenuGroup } from 'src/modules/navigation/entities/menu_groups.entity';

@Entity('categories')
@Index(['parentId', 'isDeleted'])
@Index(['slug'], { unique: true })
export class Category extends BaseEntity {
  @Column()
  name: string;

  @Column()
  slug: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  parentId: number;

  @Column({ nullable: true })
  menuGroupId: number;

  @Column({ nullable: true })
  sortOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  thumbnail: string;

  @OneToMany(() => Product, (product) => product.category)
  products: Product[];

  @ManyToOne(() => MenuGroup)
  @JoinColumn({ name: 'menuGroupId' })
  menuGroup: MenuGroup;

  @ManyToOne(() => Category)         
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @OneToMany(() => Category, (category) => category.parent)   
  children: Category[];              
}
