import {
  DeepPartial,
  Repository,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { NotFoundException } from '@nestjs/common';
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { BaseQueryDto } from './base-query.dto';
import {
  PaginationMetaDto,
  PaginationResponseDto,
} from '../dto/pagination-response.dto';

export abstract class BaseService<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}
  async create(dto: DeepPartial<T>): Promise<T> {
    dto = await this.beforeCreate(dto);
    const entity = this.repository.create(dto);
    const saved = await this.repository.save(entity);
    await this.afterCreate(entity);
    return saved
  }

  async findOne(id: number): Promise<T> {
    const entity = await this.repository.findOne({
      where: { isDeleted: true, id } as any,
    });

    if (!entity)
      throw new NotFoundException(
        `${this.getEntityName()} with ID ${id} not found`,
      );

    return entity;
  }

  async findAll(query: BaseQueryDto): Promise<PaginationResponseDto<T>> {
    const { page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const queryBuilder = this.buildBaseQuery(query);

    this.applyCustomFilters(queryBuilder, query);

    this.applySorting(queryBuilder, query);

    const total = await queryBuilder.getCount();

    // Apply pagination
    const data = await queryBuilder.skip(skip).take(limit).getMany();

    const meta = this.buildPaginationMeta(page, limit, total);

    return { data, meta };
  }

  async update(
    id: number,
    dto: DeepPartial<T>,
  ): Promise<{ message: string; affected: number }> {
    await this.findOne(id);
    const result: UpdateResult = await this.repository.update(
      id,
      dto as QueryDeepPartialEntity<T>,
    );
    return {
      message: `${this.getEntityName()} updated successfully`,
      affected: result.affected || 0,
    };
  }

  async remove(id: number): Promise<void> {
    await this.findOne(id);

    await this.repository.update(id, { isDeleted: false } as any);
  }

  async hardDelete(id: number): Promise<void> {
    const result = await this.repository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `${this.getEntityName()} with ID ${id} not found`,
      );
    }
  }

  protected buildBaseQuery(query: BaseQueryDto) {
    const alias = this.getEntityAlias();
    const queryBuilder = this.repository.createQueryBuilder(alias);

    queryBuilder.where(`${alias}.isDeleted = :isDeleted`, { isDeleted: true });

    if (query.search) {
      this.applySearchFilter(queryBuilder, query.search.trim());
    }

    return queryBuilder;
  }

  protected applySearchFilter(
    queryBuilder: SelectQueryBuilder<T>,
    search: string,
  ): void {
    const alias = this.getEntityAlias();
    queryBuilder.andWhere(`${alias}.name ILIKE :search`, {
      search: `%${search}%`,
    });
  }

  protected applySorting(
    queryBuilder: SelectQueryBuilder<T>,
    query: BaseQueryDto,
  ): void {
    const alias = this.getEntityAlias();
    queryBuilder.orderBy(`${alias}.createdAt`, query.sortOrder || 'DESC');
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<T>,
    query: any,
  ): void {
    // Child classes can override this to add custom filters
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

  protected abstract getEntityName(): string;
  protected abstract getEntityAlias(): string;

  protected async beforeCreate(dto: DeepPartial<T>): Promise<DeepPartial<T>> {
    return dto;
  }

  protected async afterCreate(entity: T): Promise<void> {}

  
}
