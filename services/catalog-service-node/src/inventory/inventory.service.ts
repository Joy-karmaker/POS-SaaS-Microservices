import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  async adjustStock(tenantId: number, adjustStockDto: AdjustStockDto) {
    const { product_id, quantity_change } = adjustStockDto;

    // We use a transaction to ensure we have the latest stock and it's consistent
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: { id: product_id, tenant_id: tenantId },
      });

      if (!product) {
        throw new NotFoundException(`Product #${product_id} not found for this tenant`);
      }

      const newQuantity = product.stock_quantity + quantity_change;

      if (newQuantity < 0) {
        throw new BadRequestException(`Cannot reduce stock below 0. Current stock: ${product.stock_quantity}`);
      }

      const updatedProduct = await tx.product.update({
        where: { id: product_id },
        data: { stock_quantity: newQuantity },
      });

      // Here you could also log the inventory adjustment to an Audit table if needed
      
      return updatedProduct;
    });
  }

  async getStock(tenantId: number, productId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, tenant_id: tenantId },
      select: { id: true, name: true, stock_quantity: true },
    });

    if (!product) {
      throw new NotFoundException(`Product #${productId} not found`);
    }

    return product;
  }
}
