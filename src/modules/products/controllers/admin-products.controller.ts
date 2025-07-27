import {
  BadRequestException,
  Body,
  Controller,
  Get,
  ParseIntPipe,
  Post,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ProductsService } from '../products.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { Product } from '../dto/entitites/product.entity';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { createBaseController } from 'src/common/base/base.controller.factory';
import { FilesInterceptor } from '@nestjs/platform-express';

const ProductsBaseController = createBaseController<Product, CreateProductDto, UpdateProductDto, ProductQueryDto>(
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
);

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@UseInterceptors(LoggingInterceptor)
export class ProductsController extends ProductsBaseController {
  constructor(private readonly productsService: ProductsService) {
    super(productsService);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('images', 10, {
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return callback(new BadRequestException('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per file
    },
  }))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ): Promise<Product> {
    return this.productsService.create(createProductDto, images);
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
