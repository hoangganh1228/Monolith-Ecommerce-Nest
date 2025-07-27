import {  Controller, Get, Post, Query, UploadedFiles, UseInterceptors } from "@nestjs/common";
import { ProductQueryDto } from "../dto/product-query.dto";
import { ProductsService } from "../products.service";

@Controller('products')
export class PublicProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll(@Query() query: ProductQueryDto) {
    query.includeInactive = true; 
    return this.productsService.findAll(query);
  }

  async findOne(@Query('slug') slug: string) {
    return this.productsService.findOneBySlug(slug);
  }
}