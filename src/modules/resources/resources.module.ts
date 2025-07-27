import { Module } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { ResourcesController } from './resources.controller';
import { Type } from 'class-transformer';
import { Resource } from '../permissions/entities/resource.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../permissions/entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Resource, Permission])],
  providers: [ResourcesService],
  controllers: [ResourcesController]
})
export class ResourcesModule {}
