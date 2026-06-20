import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CartService } from '../cart/cart.service';

@Injectable()
export class PricingService {
  constructor(private cartService: CartService) {}

  async calculatePricing(
    tenantId: number,
    payload: {
      cartId?: string;
      items?: any[];
      discountCode?: string;
      discountPercentage?: number;
    },
  ) {
    let rawItems = payload.items;

    // 1. If cartId is provided, fetch items from CartService
    if (payload.cartId) {
      rawItems = await this.cartService.getCart(tenantId, payload.cartId);
      if (!rawItems || rawItems.length === 0) {
        throw new NotFoundException(`No items found in cart #${payload.cartId}`);
      }
    }

    if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
      throw new BadRequestException('No items provided for pricing calculation');
    }

    // 2. Calculate Subtotal
    let subtotal = 0;
    const itemsSummary = rawItems.map((item) => {
      const price = parseFloat(item.price);
      const qty = parseInt(item.quantity, 10);
      if (isNaN(price) || isNaN(qty)) {
        throw new BadRequestException(`Invalid item price or quantity`);
      }
      const itemTotal = price * qty;
      subtotal += itemTotal;

      return {
        product_id: item.product_id,
        name: item.name,
        price,
        quantity: qty,
        total: parseFloat(itemTotal.toFixed(2)),
      };
    });

    // 3. Calculate Discount
    let discount = 0;
    let appliedPercentage = 0;

    if (payload.discountPercentage) {
      appliedPercentage = Math.max(0, Math.min(100, payload.discountPercentage));
      discount = subtotal * (appliedPercentage / 100);
    } else if (payload.discountCode) {
      const code = payload.discountCode.toUpperCase().trim();
      if (code === 'SAVE10') {
        appliedPercentage = 10;
        discount = subtotal * 0.1;
      } else if (code === 'SAVE20') {
        appliedPercentage = 20;
        discount = subtotal * 0.2;
      } else if (code === 'FLAT50') {
        discount = Math.min(subtotal, 50);
      } else {
        throw new BadRequestException(`Invalid discount code: ${payload.discountCode}`);
      }
    }

    // Rounding subtotal and discount
    subtotal = parseFloat(subtotal.toFixed(2));
    discount = parseFloat(discount.toFixed(2));

    // 4. Calculate Tax (Flat 15% VAT on post-discount amount)
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = parseFloat((taxableAmount * 0.15).toFixed(2));

    // 5. Calculate Total
    const total = parseFloat((taxableAmount + tax).toFixed(2));

    return {
      subtotal,
      discount,
      appliedPercentage,
      discountCode: payload.discountCode || null,
      tax,
      taxRate: 0.15,
      total,
      items: itemsSummary,
    };
  }
}
