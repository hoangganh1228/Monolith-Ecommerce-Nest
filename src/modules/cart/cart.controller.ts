import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  async getCartItems(@Req() req: any) {
    return this.cartService.getCartItems(req.user.id);
  }

  @Post('add')
  async addToCart(@Request() req: any, @Body() dto: AddToCartDto) {
    // console.log('dto', dto);
    return this.cartService.addToCart(
      req.user.userId,
      dto.productId,
      dto.quantity,
    );
  }

  @Delete(':productId')
  removeFromCart(@Request() req, @Param('productId') productId: number) {
    return this.cartService.removeFromCart(req.user.id, +productId);
  }

  @Delete()
  clearCart(@Req() req) {
    return this.cartService.clearCart(req.user.id);
  }
}
