// src/modules/categories/dto/create-category.dto.ts
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  parentId?: number;

  @IsOptional()
  @IsString()
  thumbnail?: string;
}
