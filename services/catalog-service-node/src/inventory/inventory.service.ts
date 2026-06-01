import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { InventoryGateway } from './inventory.gateway';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private inventoryGateway: InventoryGateway,
  ) {}

  async adjustStock(tenantId: number, adjustStockDto: AdjustStockDto) {
    const { product_id, quantity_change } = adjustStockDto;

    return this.prisma.$transaction(async (tx) => {
      // Perform pessimistic lock using SELECT ... FOR UPDATE
      const products: any[] = await tx.$queryRaw`
        SELECT * FROM products 
        WHERE id = ${product_id} AND tenant_id = ${tenantId} 
        FOR UPDATE
      `;

      const product = products[0];

      if (!product) {
        throw new NotFoundException(`Product #${product_id} not found for this tenant`);
      }

      const newQuantity = product.stock_quantity + quantity_change;

      if (newQuantity < 0) {
        throw new BadRequestException(`Cannot reduce stock below 0. Current stock: ${product.stock_quantity}`);
      }

      // 1. If it's a negative adjustment (representing a sale), record the sale transaction
      if (quantity_change < 0) {
        const totalAmount = Number(product.price) * Math.abs(quantity_change);
        
        const sale = await tx.sale.create({
          data: {
            tenant_id: tenantId,
            total_amount: totalAmount,
          },
        });

        await tx.saleItem.create({
          data: {
            sale_id: sale.id,
            product_id: product_id,
            quantity: Math.abs(quantity_change),
            price: product.price,
          },
        });
      }

      // 2. Recalculate forecasting metrics for this product over a rolling 30-day window
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const saleAggregate = await tx.saleItem.aggregate({
        _sum: {
          quantity: true,
        },
        where: {
          product_id: product_id,
          sale: {
            tenant_id: tenantId,
            created_at: {
              gte: thirtyDaysAgo,
            },
          },
        },
      });

      const totalSold = saleAggregate._sum.quantity || 0;

      const now = new Date();
      const createdDate = new Date(product.created_at);
      const diffMs = Math.abs(now.getTime() - createdDate.getTime());
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const activeDays = Math.max(1, Math.min(30, diffDays));

      const velocity = Number((totalSold / activeDays).toFixed(2));

      let stockOutDate: Date | null = null;
      if (velocity > 0 && newQuantity > 0) {
        const daysRemaining = newQuantity / velocity;
        stockOutDate = new Date();
        stockOutDate.setDate(stockOutDate.getDate() + daysRemaining);
      } else if (newQuantity === 0) {
        stockOutDate = new Date(); // Stocks out today/immediately
      }

      // 3. Update stock quantity and pre-computed cached analytics columns in the database
      const updatedProduct = await tx.product.update({
        where: { id: product_id },
        data: {
          stock_quantity: newQuantity,
          sales_velocity: velocity,
          stock_out_date: stockOutDate,
        },
        include: { category: true },
      });

      // 4. Broadcast real-time stock and forecasting updates to all connected cashiers/admins
      this.inventoryGateway.broadcastStockUpdate(tenantId, product_id, newQuantity);
      this.inventoryGateway.broadcastProductUpdated(tenantId, updatedProduct);
      
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
