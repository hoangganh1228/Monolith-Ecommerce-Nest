import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from '../products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { Product } from '../product.entity';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { createBaseController } from 'src/common/base/base.controller.factory';

const ProductsBaseController = createBaseController<Product, CreateProductDto, UpdateProductDto, ProductQueryDto>(
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
);

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(LoggingInterceptor)
export class ProductsController extends ProductsBaseController {
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
