import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import axios from 'axios';
import * as crypto from 'crypto';

@Injectable()
export class CartService {
  constructor(private redisService: RedisService) {}

  private getCartKey(tenantId: number, cartId: string): string {
    return `tenant:${tenantId}:cart:${cartId}`;
  }

  async createCart(): Promise<{ cartId: string }> {
    const cartId = crypto.randomUUID();
    return { cartId };
  }

  async getCart(tenantId: number, cartId: string): Promise<any[]> {
    const key = this.getCartKey(tenantId, cartId);
    const cartJson = await this.redisService.getClient().get(key);
    return cartJson ? JSON.parse(cartJson) : [];
  }

  async addItem(
    tenantId: number,
    cartId: string,
    productId: number,
    quantity: number,
    authHeader: string,
  ): Promise<any[]> {
    if (quantity <= 0) {
      throw new BadRequestException('Quantity must be greater than 0');
    }

    // 1. Validate product exists and get details from catalog service
    const product = await this.getProductFromCatalog(productId, authHeader);

    // 2. Check stock level
    if (product.stock_quantity < quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${product.stock_quantity}`);
    }

    const key = this.getCartKey(tenantId, cartId);
    const cartJson = await this.redisService.getClient().get(key);
    const items: any[] = cartJson ? JSON.parse(cartJson) : [];

    const existingIndex = items.findIndex((i) => i.product_id === productId);
    if (existingIndex > -1) {
      const newQty = items[existingIndex].quantity + quantity;
      if (product.stock_quantity < newQty) {
        throw new BadRequestException(`Insufficient stock. Cannot add more. Available: ${product.stock_quantity}`);
      }
      items[existingIndex].quantity = newQty;
    } else {
      items.push({
        product_id: productId,
        name: product.name,
        price: parseFloat(product.price),
        sku: product.sku,
        barcode: product.barcode,
        quantity,
      });
    }

    await this.redisService.getClient().setex(key, 86400, JSON.stringify(items));
    return items;
  }

  async updateItem(
    tenantId: number,
    cartId: string,
    productId: number,
    quantity: number,
    authHeader: string,
  ): Promise<any[]> {
    if (quantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    const key = this.getCartKey(tenantId, cartId);
    const cartJson = await this.redisService.getClient().get(key);
    if (!cartJson) {
      throw new NotFoundException(`Cart #${cartId} not found`);
    }

    const items: any[] = JSON.parse(cartJson);
    const existingIndex = items.findIndex((i) => i.product_id === productId);
    if (existingIndex === -1) {
      throw new NotFoundException(`Product #${productId} not found in cart`);
    }

    if (quantity === 0) {
      items.splice(existingIndex, 1);
    } else {
      // Validate stock level
      const product = await this.getProductFromCatalog(productId, authHeader);
      if (product.stock_quantity < quantity) {
        throw new BadRequestException(`Insufficient stock. Available: ${product.stock_quantity}`);
      }
      items[existingIndex].quantity = quantity;
    }

    await this.redisService.getClient().setex(key, 86400, JSON.stringify(items));
    return items;
  }

  async removeItem(tenantId: number, cartId: string, productId: number): Promise<any[]> {
    const key = this.getCartKey(tenantId, cartId);
    const cartJson = await this.redisService.getClient().get(key);
    if (!cartJson) {
      throw new NotFoundException(`Cart #${cartId} not found`);
    }

    const items: any[] = JSON.parse(cartJson);
    const existingIndex = items.findIndex((i) => i.product_id === productId);
    if (existingIndex === -1) {
      throw new NotFoundException(`Product #${productId} not found in cart`);
    }

    items.splice(existingIndex, 1);
    await this.redisService.getClient().setex(key, 86400, JSON.stringify(items));
    return items;
  }

  async clearCart(tenantId: number, cartId: string): Promise<void> {
    const key = this.getCartKey(tenantId, cartId);
    await this.redisService.getClient().del(key);
  }

  private async getProductFromCatalog(productId: number, authHeader: string): Promise<any> {
    const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3000';
    try {
      const response = await axios.get(`${catalogUrl}/products/${productId}`, {
        headers: {
          Authorization: authHeader,
        },
      });
      return response.data;
    } catch (e: any) {
      if (e.response && e.response.status === 404) {
        throw new NotFoundException(`Product #${productId} not found in catalog`);
      }
      throw new BadRequestException(`Failed to validate product against catalog: ${e.message}`);
    }
  }
}
