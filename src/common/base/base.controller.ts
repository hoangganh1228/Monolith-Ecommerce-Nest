import { BaseService } from './base.service';
import {
  Param,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Post,
  ParseIntPipe,
  Put,
  Delete,
  Body,
  ValidationPipe,
} from '@nestjs/common';
import { BaseQueryDto } from './base-query.dto';
import { PaginationResponseDto } from '../dto/pagination-response.dto';
import { BaseEntity } from './base.entity';

export abstract class BaseController<
  T extends BaseEntity,
  CreateDto,
  UpdateDto,
> {
  constructor(protected readonly service: BaseService<T>) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDto): Promise<T> {
    return this.service.create(dto as any);
  }

  @Get()
  async findAll(
    @Query(ValidationPipe) query: BaseQueryDto,
  ): Promise<PaginationResponseDto<T>> {
    return this.service.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<T> {
    return this.service.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDto,
  ): Promise<{ message: string; affected: number }> {
    return this.service.update(id, dto as any);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.service.remove(id);
    return { message: 'Entity deleted successfully' };
  }

  @Delete(':id/hard')
  @HttpCode(HttpStatus.OK)
  async hardDelete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    await this.service.hardDelete(id);
    return { message: 'Entity permanently deleted' };
  }
}
