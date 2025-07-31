import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminCategoriesController } from './controllers/admin-categories.controller';
import { Category } from './entities/categories.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],
  providers: [CategoriesService, CloudinaryService],
  controllers: [AdminCategoriesController],
})
export class CategoriesModule {}
