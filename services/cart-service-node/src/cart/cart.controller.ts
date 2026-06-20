import { Controller, Get, Post, Patch, Delete, Body, Param, Headers, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

function extractAuthHeader(authHeader: string | undefined, cookieHeader: string | undefined): string {
  if (authHeader) return authHeader;
  if (cookieHeader) {
    const match = cookieHeader.match(/pos_access_token=([^;]+)/);
    if (match) return `Bearer ${decodeURIComponent(match[1])}`;
  }
  return '';
}

@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post()
  createCart() {
    return this.cartService.createCart();
  }

  @Get(':id')
  getCart(@CurrentUser() user: any, @Param('id') id: string) {
    return this.cartService.getCart(user.tenant_id, id);
  }

  @Post(':id/items')
  addItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body('product_id') productId: number,
    @Body('quantity') quantity: number,
    @Headers('authorization') authHeader: string,
    @Headers('cookie') cookieHeader: string,
  ) {
    const tokenHeader = extractAuthHeader(authHeader, cookieHeader);
    return this.cartService.addItem(user.tenant_id, id, +productId, +quantity, tokenHeader);
  }

  @Patch(':id/items/:productId')
  updateItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
    @Headers('authorization') authHeader: string,
    @Headers('cookie') cookieHeader: string,
  ) {
    const tokenHeader = extractAuthHeader(authHeader, cookieHeader);
    return this.cartService.updateItem(user.tenant_id, id, +productId, +quantity, tokenHeader);
  }

  @Delete(':id/items/:productId')
  removeItem(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(user.tenant_id, id, +productId);
  }

  @Delete(':id')
  async clearCart(@CurrentUser() user: any, @Param('id') id: string) {
    await this.cartService.clearCart(user.tenant_id, id);
    return { success: true };
  }
}
