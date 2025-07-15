import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { DataSource, Repository } from 'typeorm';
import { OrderItem } from './entities/order-item.entity';
import { CartItem } from '../cart/entities/cart-item.entity';
import { Product } from '../products/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(CartItem)
    private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    private dataSource: DataSource,
  ) {}

  async createOrder(userId: number, createOrderDto: CreateOrderDto) {
    const cartItems = await this.cartItemRepository.find({
      where: { user: { id: userId } },
      relations: ['product', 'user'],
    });

    if (!cartItems.length) throw new NotFoundException('No items in cart');

    return this.dataSource.transaction(async (manager) => {
      let totalPrice = 0;

      for (const cartItem of cartItems) {
        const product = await manager.findOne(Product, {
          where: { id: cartItem.product.id },
        });

        if (!product || product.stock < cartItem.quantity)
          throw new NotFoundException('Product not found or not enough stock');

        totalPrice += product.price * cartItem.quantity;
      }

      const order = manager.create(Order, {
        user: { id: userId },
        total_price: totalPrice,
        shippingAddress: createOrderDto.shippingAddress,
        status: OrderStatus.PENDING,
      });

      const savedOrder = await manager.save(order);

      for (const cartItem of cartItems) {
        const product = await manager.findOne(Product, {
          where: { id: cartItem.product.id },
        });
        const subtotal = product!.price * cartItem.quantity;
        const orderItem = manager.create(OrderItem, {
          order: savedOrder,
          product: product!,
          quantity: cartItem.quantity,
          unit_price: product!.price,
          product_name: product!.name,
          subtotal,
        });
        await manager.save(orderItem);
        product!.stock -= cartItem.quantity;
        await manager.save(product);
      }
      await manager.delete(CartItem, { user: { id: userId } });
      return manager.findOne(Order, {
        where: { id: savedOrder.id },
        relations: ['user', 'items', 'items.product'],
      });
    });
  }

  async updateOrderStatus(orderId: number, status: OrderStatus) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'items.product'],
    });

    if (!order) throw new NotFoundException('Order not found');
    if (
      status === OrderStatus.CANCELLED &&
      order.status !== OrderStatus.CANCELLED
    ) {
      for (const item of order.items) {
        const product = await this.productRepository.findOne({
          where: { id: item.product.id },
        });
        if (!product) throw new NotFoundException('Product not found');
        product.stock += item.quantity;
      }
    } else {
      order.status = status;
      return this.orderRepository.save(order);
    }
    return order;
  }

  async getUserOrders(userId: number) {
    return this.orderRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'items.product'],
      order: { created_at: 'DESC' },
    });
  }

  async getOrderById(orderId: number, userId?: number) {
    const where: any = { id: orderId };
    if (userId) {
      where.user = { id: userId };
    }

    return this.orderRepository.findOne({
      where,
      relations: ['user', 'items', 'items.product'],
    });
  }

  async cancelOrder(orderId: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId, user: { id: userId } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Can only cancel pending orders');
    }

    return this.updateOrderStatus(orderId, OrderStatus.CANCELLED);
  }
}
