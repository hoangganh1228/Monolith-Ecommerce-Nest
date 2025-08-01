import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { AdminCategoriesController } from './controllers/admin-categories.controller';
import { Category } from './entities/categories.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { MenuGroup } from '../navigation/entities/menu_groups.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, MenuGroup])],
  providers: [CategoriesService, CloudinaryService],
  controllers: [AdminCategoriesController],
  exports: [CategoriesService, TypeOrmModule.forFeature([Category])],
})
export class CategoriesModule {}
