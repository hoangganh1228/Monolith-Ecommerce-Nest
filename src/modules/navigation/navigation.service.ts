import { Injectable } from '@nestjs/common';
import { BaseService } from 'src/common/base/base.service';
import { MenuGroup } from './entities/menu_groups.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository } from 'typeorm';
import { slugify } from 'src/common/utils/slugify';

@Injectable()
export class NavigationService extends BaseService<MenuGroup> {
  constructor(
    @InjectRepository(MenuGroup)
    private readonly menuGroupRepository: Repository<MenuGroup>
  ) {
    super(menuGroupRepository)
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    const qb = this.menuGroupRepository
      .createQueryBuilder('p')
      .select('p.slug', 'slug')
      .where('p.slug ILIKE :slug', { slug: `${baseSlug}%` });

    const rows = await qb.getRawMany<{ slug: string }>();
    const taken = new Set(rows.map(r => r.slug));

    if (!taken.has(baseSlug)) return baseSlug;

    let i = 1;
    let candidate = `${baseSlug}-${i}`;
    while (taken.has(candidate)) {
      i++;
      candidate = `${baseSlug}-${i}`;
    }
    return candidate;
  }

  protected async beforeCreate(dto: DeepPartial<MenuGroup>): Promise<DeepPartial<MenuGroup>> {
    if (dto.name) {
      const baseSlug = slugify(dto.name);
      dto.slug = await this.generateUniqueSlug(baseSlug);
    }
    return dto;
  }

  protected getEntityName(): string {
    return 'MenuGroup';
  }

  protected getEntityAlias(): string {
    return 'MenuGroup';
  }
}
