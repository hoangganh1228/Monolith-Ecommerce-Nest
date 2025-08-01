import { NavigationService } from './navigation.service';
import { Controller } from '@nestjs/common';
import { BaseController } from 'src/common/base/base.controller';
import { MenuGroup } from './entities/menu_groups.entity';
import { CreateMenuGroupDto } from './dtos/create-menu-group.dto';
import { UpdateCategoryDto } from '../categories/dtos/update-category.dto';

@Controller('admin/menu-group')
export class NavigationController extends BaseController<MenuGroup, CreateMenuGroupDto, UpdateCategoryDto>{
  constructor(protected readonly navigationService: NavigationService) {
    super(navigationService)
  }
}
