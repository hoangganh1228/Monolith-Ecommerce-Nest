import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, ProductSortBy } from './dto/product-query.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-response.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  create(dto: CreateProductDto) {
    const product = this.productRepository.create(dto);
    return this.productRepository.save(product);
  }

  async findAll(query: ProductQueryDto) {
    const queryBuilder = this.createQueryBuilder(query);
    const total = await queryBuilder.getCount();
    const products = await queryBuilder.getMany();
    
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;
    
    queryBuilder.skip(skip).take(limit);

    const meta: PaginationMetaDto = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrevious: page > 1,
    };

    return {data: products, meta};
  }

  findOne(id: number) {
    return this.productRepository.findOne({ where: { id } });
  }

  update(id: number, dto: UpdateProductDto) {
    return this.productRepository.update(id, dto);
  }

  async remove(id: number): Promise<void> {
    const product = await this.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    // Soft delete by setting isActive to false
    await this.productRepository.update(id, { isActive: false });
  }

  async hardDelete(id: number): Promise<void> {
    const result = await this.productRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
  }

  private createQueryBuilder(query: ProductQueryDto): SelectQueryBuilder<Product> {
    const queryBuilder = this.productRepository.createQueryBuilder('product');

    queryBuilder.where('product.isActive = :isActive', { isActive: true });

    if (query.search) {
      queryBuilder.andWhere('product.name ILIKE :search', { search: `%${query.search}%` });
    }

    if (query.categoryId) {
      queryBuilder.andWhere('product.categoryId = :categoryId', { categoryId: query.categoryId });
    }

    if (query.minPrice) {
      queryBuilder.andWhere('product.price >= :minPrice', { minPrice: query.minPrice });
    }

    if (query.maxPrice) {
      queryBuilder.andWhere('product.price <= :maxPrice', { maxPrice: query.maxPrice });
    }

    if (query.inStock) {
      queryBuilder.andWhere('product.stock > 0');
    } else { 
      queryBuilder.andWhere('product.stock = 0');
    }

    if (query.tags && query.tags.length > 0) {
      queryBuilder.andWhere('product.tags && :tags', { tags: query.tags });
    }
    
    this.applySorting(queryBuilder, query);

    return queryBuilder;
  }

  private applySorting(queryBuilder: SelectQueryBuilder<Product>, query: ProductQueryDto): void {
    switch (query.sortBy) {
      case ProductSortBy.NAME:
        queryBuilder.orderBy('product.name', query.sortOrder);
        break;
      case ProductSortBy.PRICE:
        queryBuilder.orderBy('product.price', query.sortOrder);
        break;
      case ProductSortBy.POPULARITY:
        queryBuilder.orderBy('product.viewCount', query.sortOrder);
        queryBuilder.addOrderBy('product.soldCount', query.sortOrder);
        break;
      case ProductSortBy.STOCK:
        queryBuilder.orderBy('product.stock', query.sortOrder);
        break;
      case ProductSortBy.CREATED_AT:
      default:
        queryBuilder.orderBy('product.createdAt', query.sortOrder);
        break;
    }
  }
}
