import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/categories.entity';
import { Repository } from 'typeorm';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { slugify } from 'src/common/utils/slugify';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';

@Injectable()
export class CategoriesService {
    constructor(
      @InjectRepository(Category)
      private categoryRepo: Repository<Category>,
      private cloudinaryService: CloudinaryService, // Assuming you have a CloudinaryService for image uploads
    ) {}

    private async generateUniqueSlug(baseSlug: string): Promise<string> {
      const qb = this.categoryRepo
        .createQueryBuilder('c')
        .select('c.slug', 'slug')
        .where('c.slug ILIKE :slug', { slug: `${baseSlug}%` });

      const rows = await qb.getRawMany<{ slug: string }>();
      const taken = new Set(rows.map(r => r.slug));

      if (!taken.has(baseSlug)) return baseSlug;

      let i = 1;
      let candidate = `${baseSlug}-${i}`;
      while (taken.has(candidate)) {
        i++;
        candidate = `${baseSlug}-${i}`;
      }
      return candidate;
    }

    async create(dto: CreateCategoryDto, thumbnail?: Express.Multer.File): Promise<Category> {
      const baseSlug = slugify(dto.name);
      const slug = await this.generateUniqueSlug(baseSlug);

      const category = this.categoryRepo.create({
        ...dto,
        slug
      });


      if (thumbnail) {
      const uploadResult = await this.cloudinaryService.uploadImage(
        thumbnail,
        'categories',
      );
      category.thumbnail = uploadResult.secure_url;
    }

    return this.categoryRepo.save(category);
    }

  async findAll(): Promise<Category[]> {
    return this.categoryRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepo.findOneBy({ id });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);
    if (dto.name) category.slug = slugify(dto.name);
    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async remove(id: number): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryRepo.softRemove(category);
  } 
}
