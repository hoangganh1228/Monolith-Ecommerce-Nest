import { Module } from '@nestjs/common';
import { NavigationController } from './navigation.controller';
import { NavigationService } from './navigation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../categories/entities/categories.entity';
import { MenuGroup } from './entities/menu_groups.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MenuGroup, Category])],
  controllers: [NavigationController],
  providers: [NavigationService]
})
export class NavigationModule {}
