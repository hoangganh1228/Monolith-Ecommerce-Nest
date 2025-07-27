import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductViewMiddleware } from 'src/common/middlewares/product-view.middleware';
import { PermissionsModule } from '../permissions/permissions.module';
import { ProductsController } from './controllers/admin-products.controller';
import { PublicProductsController } from './controllers/products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product]), PermissionsModule],
  controllers: [ProductsController, PublicProductsController],
  providers: [ProductsService],
})
export class ProductsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ProductViewMiddleware).forRoutes('products');
  }
}
