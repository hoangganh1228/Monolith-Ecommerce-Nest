import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, ProductSortBy } from './dto/product-query.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-response.dto';
import { BaseService } from 'src/common/base/base.service';
import { slugify } from 'src/common/utils/slugify';

@Injectable()
export class ProductsService extends BaseService<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {
    super(productRepository);
  }

  async getSearchSuggestions(
    keyword: string,
    limit: number = 5,
  ): Promise<string[]> {
    if (!keyword?.trim()) {
      return [];
    }

    const products = await this.productRepository
      .createQueryBuilder('product')
      .select('DISTINCT product.name', 'name')
      .where('product.name ILIKE :keyword', { keyword: `%${keyword.trim()}%` })
      .andWhere('product.isDeleted = :isDeleted', { isDeleted: true })
      .orderBy('product.name', 'ASC')
      .limit(limit)
      .getRawMany();

    return products.map((p) => p.name);
  }

  async findOneBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug, isDeleted: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug ${slug} not found`);
    }

    return product;
  }

  async getPopularProducts(limit: number = 10): Promise<Product[]> {
    return this.productRepository
      .createQueryBuilder('product')
      .where('product.isDeleted = :isDeleted', { isDeleted: true })
      .orderBy('product.viewCount', 'DESC')
      .addOrderBy('product.soldCount', 'DESC')
      .addOrderBy('product.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  // Override base class methods
  protected getEntityName(): string {
    return 'Product';
  }

  protected getEntityAlias(): string {
    return 'product';
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<Product>,
    query: ProductQueryDto,
  ): void {
    if (query.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.minPrice !== undefined) {
      queryBuilder.andWhere('product.price >= :minPrice', {
        minPrice: query.minPrice,
      });
    }

    if (query.includeInactive) {
      queryBuilder.andWhere('product.isActive = :isActive', {
        isActive: true,
      });
    }

    if (query.maxPrice !== undefined) {
      queryBuilder.andWhere('product.price <= :maxPrice', {
        maxPrice: query.maxPrice,
      });
    }

    if (query.inStock) {
      queryBuilder.andWhere('product.stock > 0');
    }

    if (query.tags && query.tags.length > 0) {
      queryBuilder.andWhere('product.tags && :tags', { tags: query.tags });
    }
  }

  protected applySorting(
    queryBuilder: SelectQueryBuilder<Product>,
    query: ProductQueryDto,
  ): void {
    const { sortBy = ProductSortBy.CREATED_AT, sortOrder = 'DESC' } = query;

    switch (sortBy) {
      case ProductSortBy.NAME:
        queryBuilder.orderBy('product.name', sortOrder);
        break;
      case ProductSortBy.PRICE:
        queryBuilder.orderBy('product.price', sortOrder);
        break;
      case ProductSortBy.POPULARITY:
        queryBuilder
          .orderBy('product.viewCount', sortOrder)
          .addOrderBy('product.soldCount', sortOrder);
        break;
      case ProductSortBy.STOCK:
        queryBuilder.orderBy('product.stock', sortOrder);
        break;
      case ProductSortBy.CREATED_AT:
      default:
        queryBuilder.orderBy('product.createdAt', sortOrder);
        break;
    }
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    const qb = this.productRepository
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

  protected async beforeCreate(dto: DeepPartial<Product>): Promise<DeepPartial<Product>> {
    if (dto.name) {
      const baseSlug = slugify(dto.name);
      dto.slug = await this.generateUniqueSlug(baseSlug);
    }
    return dto;
  }
}
