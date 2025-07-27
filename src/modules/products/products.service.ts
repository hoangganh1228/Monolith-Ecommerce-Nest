import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './dto/entitites/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, ProductSortBy } from './dto/product-query.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-response.dto';
import { BaseService } from 'src/common/base/base.service';
import { slugify } from 'src/common/utils/slugify';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { ProductImage } from './dto/entitites/product-images.entity';

@Injectable()
export class ProductsService extends BaseService<Product> {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    super(productRepository);
  }

  async create(
    createProductDto: CreateProductDto, 
    images?: Express.Multer.File[]
  ): Promise<Product> {
    let productImages: Partial<ProductImage>[] = [];
    
    // Upload images if provided
    if (images && images.length > 0) {
      const uploadResults = await Promise.all(
        images.map(image => this.cloudinaryService.uploadImage(image))
      );
      
      // Convert CloudinaryUploadResult to ProductImage format
      productImages = uploadResults.map((result, index) => ({
        imageUrl: result.secure_url, // Match the field name in ProductImage entity
        publicId: result.public_id,
        altText: `${createProductDto.name} image ${index + 1}`,
        sortOrder: index,
        // productId will be set automatically by TypeORM when saving the relation
      }));
    }

    // Create product data - TypeORM will handle the cascade save of images
    const productData = {
      ...createProductDto,
      images: productImages,
    };

    return super.create(productData);
  }

  async update(
    id: number, 
    updateProductDto: UpdateProductDto, 
    images?: Express.Multer.File[]
  ) {
    // If images are provided, we need to handle them separately
    if (images && images.length > 0) {
      // Get existing product to manage old images
      const existingProduct = await this.findOne(id);
      
      // Upload new images
      const uploadResults = await Promise.all(
        images.map(image => this.cloudinaryService.uploadImage(image))
      );
      
      const newProductImages: Partial<ProductImage>[] = uploadResults.map((result, index) => ({
        imageUrl: result.secure_url,
        publicId: result.public_id,
        altText: `${updateProductDto.name || existingProduct.name} image ${index + 1}`,
        sortOrder: index,
      }));

      const updateData = {
        ...updateProductDto,
        images: newProductImages,
      };

      return super.update(id, updateData);
    }

    // If no images provided, just update other fields
    return super.update(id, updateProductDto);
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
