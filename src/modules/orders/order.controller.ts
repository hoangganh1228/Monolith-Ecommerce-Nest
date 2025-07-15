import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './entities/order.entity';

@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  async createOrder(
    @Request() req: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    return this.orderService.createOrder(req.user.userId, createOrderDto);
  }

  @Get()
  async getUserOrders(@Request() req: any) {
    return this.orderService.getUserOrders(req.user.userId);
  }

  @Get(':id')
  async getOrderById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.orderService.getOrderById(id, req.user.userId);
  }

  @Patch(':id/cancel')
  async cancelOrder(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.orderService.cancelOrder(id, req.user.userId);
  }

  // Admin endpoint - đơn giản
  @Patch(':id/status/:status')
  async updateOrderStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('status') status: OrderStatus,
  ) {
    return this.orderService.updateOrderStatus(id, status);
  }
}
