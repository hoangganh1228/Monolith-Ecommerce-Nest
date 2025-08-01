import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './dto/entitites/product.entity';
import { ProductViewMiddleware } from 'src/common/middlewares/product-view.middleware';
import { PermissionsModule } from '../permissions/permissions.module';
import { ProductsController } from './controllers/admin-products.controller';
import { PublicProductsController } from './controllers/products.controller';
import { ProductImage } from './dto/entitites/product-images.entity';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductImage]), PermissionsModule, CategoriesModule],
  controllers: [ProductsController, PublicProductsController],
  providers: [ProductsService, CloudinaryService],
})
export class ProductsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProductViewMiddleware).forRoutes('products');
  }
}
