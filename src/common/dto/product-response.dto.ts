export class ProductResponseDto {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  categoryId: number;
  tags: string[];
  isActive: boolean;
  viewCount: number;
  soldCount: number;
  isInStock: boolean;
  isPopular: boolean;
  createdAt: Date;
}