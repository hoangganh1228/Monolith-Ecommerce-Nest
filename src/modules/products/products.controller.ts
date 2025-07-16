import {
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { BaseController } from 'src/common/base/base.controller';
import { Product } from './product.entity';

@Controller('products')
@UseInterceptors(LoggingInterceptor)
export class ProductsController extends BaseController<
  Product,
  CreateProductDto,
  UpdateProductDto
> {
  constructor(private readonly productsService: ProductsService) {
    super(productsService);
  }

  // Override findAll to use ProductQueryDto instead of BaseQueryDto
  @Get()
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Get('popular')
  async getPopular(
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<Product[]> {
    return this.productsService.getPopularProducts(limit);
  }

  @Get('search-suggestions')
  async getSearchSuggestions(
    @Query('keyword') keyword: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 5,
  ): Promise<string[]> {
    return this.productsService.getSearchSuggestions(keyword, limit);
  }
}
