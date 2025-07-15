import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Product } from '../products/product.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { CartItem } from './entities/cart-item.entity';
import { User } from '../users/user.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product) private productRepository: Repository<Product>,
  ) {}

  async addToCart(userId: number, productId: number, quantity: number) {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.stock < quantity) {
      throw new BadRequestException('Not enough stock available');
    }

    // Kiểm tra xem đã có trong giỏ chưa
    const existingItem = await this.cartItemRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
      relations: ['product', 'user'],
    });

    if (existingItem) {
      const totalQuantity = existingItem.quantity + quantity;

      if (totalQuantity > product.stock) {
        throw new BadRequestException(
          `Maximum ${product.stock} items allowed for this product`,
        );
      }

      existingItem.quantity = totalQuantity;
      return this.cartItemRepository.save(existingItem);
    }

    // Nếu chưa có item nào trong giỏ
    const newItem = this.cartItemRepository.create({
      user: { id: userId } as User,
      product: { id: productId } as Product,
      quantity,
    });

    await this.cartItemRepository.save(newItem);
    return this.cartItemRepository.findOne({
      where: { id: newItem.id },
      relations: ['user', 'product'],
    });
  }

  async getCartItems(userId: number) {
    return this.cartItemRepository.find({
      where: { user: { id: userId } },
      relations: ['product'],
    });
  }

  async removeFromCart(userId: number, productId: number) {
    const result = await this.cartItemRepository.delete({
      user: { id: userId },
      product: { id: productId },
    });
    if (result.affected === 0) {
      throw new NotFoundException('Item not found in cart');
    }
    return result;
  }

  async clearCart(userId: number) {
    await this.cartItemRepository.delete({ user: { id: userId } });
  }
}
