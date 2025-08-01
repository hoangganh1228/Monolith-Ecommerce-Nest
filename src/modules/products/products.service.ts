import { CategoriesService } from './../categories/categories.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from './dto/entitites/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DeepPartial, Repository, SelectQueryBuilder } from 'typeorm';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto, ProductSortBy } from './dto/product-query.dto';
import { PaginationMetaDto, PaginationResponseDto } from 'src/common/dto/pagination-response.dto';
import { slugify } from 'src/common/utils/slugify';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { ProductImage } from './dto/entitites/product-images.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly categoriesService: CategoriesService,
  ) {
  }

  protected buildPaginationMeta(
    page: number,
    limit: number,
    total: number,
  ): PaginationMetaDto {
    const totalPages = Math.ceil(total / limit);

    return {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
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
      
      productImages = uploadResults.map((result, index) => ({
        imageUrl: result.secure_url, // Match the field name in ProductImage entity
        publicId: result.public_id,
        altText: `${createProductDto.name} image ${index + 1}`,
        sortOrder: index,
      }));
    }
    
    if(createProductDto.categoryId) {
      const category = await this.categoriesService.findOne(createProductDto.categoryId);
      if (!category) {
        throw new NotFoundException(`Category with ID ${createProductDto.categoryId} not found`);
      }
    }

    const baseSlug = slugify(createProductDto.name);
    const slug = await this.generateUniqueSlug(baseSlug);

    const productData = {
      ...createProductDto,
      images: productImages,
      slug
    };

    return this.productRepository.save(productData);
  }

  async update(
    id: number, 
    updateProductDto: UpdateProductDto, 
    images?: Express.Multer.File[]
  ) {
    // If images are provided, we need to handle them separately
    if (images && images.length > 0) {
      // Get existing product to manage old images
      const existingProduct = await this.productRepository.findOne({ where: { id } });
      if (!existingProduct) {
        throw new NotFoundException(`Product with ID ${id} not found`);
      }

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

      return this.productRepository.save(updateData);
    }

    // If no images provided, just update other fields
    return this.productRepository.save(updateProductDto);
  }

  async findAll(query: ProductQueryDto): Promise<PaginationResponseDto<Product>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'image');


      this.applyCustomFilters(queryBuilder, query);
  
      this.applySorting(queryBuilder, query);
  
      const total = await queryBuilder.getCount();
  
      // Apply pagination
      const data = await queryBuilder.skip(skip).take(limit).getMany();

      const meta = this.buildPaginationMeta(page, limit, total);

      return { data, meta };
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
  
}
