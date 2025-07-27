import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Resource } from '../permissions/entities/resource.entity';
import { Repository } from 'typeorm';
import { Permission } from '../permissions/entities/permission.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateResourceDto } from './dtos/create-resource.dto';
import { UpdateResourceDto } from './dtos/update-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
      @InjectRepository(Resource)
      private readonly resourceRepository: Repository<Resource>,
      @InjectRepository(Permission)
      private readonly permissionRepository: Repository<Permission>,
  ) {}

  async findAll() {
      return this.resourceRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: number) {
    const resource = await this.resourceRepository.findOne({ where: { id }, relations: ['permissions'] });
    if (!resource) throw new NotFoundException('Resource not found');
    return resource;
  }

  async findOneByName(name: string) {
    return this.resourceRepository.findOneBy({ name });
  }

  async create(dto: CreateResourceDto) {
    const { name, actions } = dto;
    const existing = await this.findOneByName(name);
    if (existing) throw new ConflictException('Resource already exists');

    const resource = await this.resourceRepository.save(
    this.resourceRepository.create({ name }),
  );

    for (const action of actions) {
      const permission = this.permissionRepository.create({
        resourceId: resource.id,
        action,
        code: `${name}:${action}`,
        description: `Permission for ${name} to ${action}`,
      });
      await this.permissionRepository.save(permission);
    }

    return { resource, createdPermissions: actions };
  }

  async update(id: number, dto: UpdateResourceDto) {
    const resource = await this.resourceRepository.findOne({
      where: { id },
      relations: ['permissions'], // 👈 để map được `resource.permissions`
    });
    if (!resource) throw new NotFoundException('Resource not found');

    if (dto.name) {
      const existing = await this.findOneByName(dto.name);
      if (existing && existing.id !== id) {
        throw new ConflictException('Resource name already exists');
      }

      const oldName = resource.name;
      const newName = dto.name;

      for (const permission of resource.permissions) {
        permission.code = permission.code.replace(`${oldName}:`, `${newName}:`);
      }
      await this.permissionRepository.save(resource.permissions);

      resource.name = dto.name;
    }

    if (dto.actions) {
      const currentActions = resource.permissions.map(p => p.action);
      const toAdd = dto.actions.filter(a => !currentActions.includes(a));
      const toRemove = resource.permissions.filter(p => !dto.actions!.includes(p.action));

      for (const action of toAdd) {
        const permission = this.permissionRepository.create({
          resourceId: resource.id,
          action,
          code: `${dto.name ?? resource.name}:${action}`,
          description: `Permission for ${dto.name ?? resource.name} to ${action}`,
        });
        await this.permissionRepository.save(permission);
      }
      for (const permission of toRemove) {
        await this.permissionRepository.remove(permission);
      }
    }

    return this.resourceRepository.save(resource);
  }

  async remove(id: number) {
    const resource = await this.findOne(id);
    await this.permissionRepository.delete({ resourceId: resource.id });
    await this.resourceRepository.remove(resource);
    return { deleted: true };
  }

}
