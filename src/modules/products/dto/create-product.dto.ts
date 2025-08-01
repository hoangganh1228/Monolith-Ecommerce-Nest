import { Transform, Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsUrl,
  IsBoolean,
  IsArray,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Name must be at least 1 character long' })
  name: string;

  @IsString() 
  @IsNotEmpty()
  description: string;
  
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  // @IsOptional()
  // @IsUrl()
  // imageUrl?: string;
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  categoryId?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isDeleted?: boolean = true;

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  stock?: number = 0;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(alt => alt.trim());
    }
    return value;
  })
  imageAltTexts?: string[];
}
