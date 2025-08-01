import { BaseEntity } from "src/common/base/base.entity";
import { Category } from "src/modules/categories/entities/categories.entity";
import { Column, Entity, OneToMany } from "typeorm";

@Entity('menu_groups')
export class MenuGroup extends BaseEntity {
  @Column()
  name: string;

  @Column()
  slug: string;

  @Column()
  sortOrder: number;

  @OneToMany(() => Category, (category) => category.menuGroup)
  categories: Category[];
}