import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Idempotent handler for sale.completed events (CQRS read-side aggregation).
   * The sale_events table enforces idempotency via a unique event_id.
   */
  async handleSaleCompleted(payload: any) {
    const tenantId = BigInt(payload.tenant_id);
    const totalItems = (payload.items || []).reduce((sum: number, i: any) => sum + i.quantity, 0);

    // Idempotency guard: duplicate event_id is a no-op.
    try {
      await this.prisma.saleEvent.create({
        data: {
          event_id: payload.event_id,
          tenant_id: tenantId,
          order_id: payload.order_id,
        },
      });
    } catch (e: any) {
      // Unique violation => already processed.
      return;
    }

    const occurred = payload.occurred_at ? new Date(payload.occurred_at) : new Date();
    const date = new Date(occurred.getFullYear(), occurred.getMonth(), occurred.getDate());
    const hour = new Date(occurred.getFullYear(), occurred.getMonth(), occurred.getDate(), occurred.getHours());

    await this.prisma.dailySale.upsert({
      where: { tenant_id_date: { tenant_id: tenantId, date } },
      update: {
        total_sales: { increment: payload.total },
        total_orders: { increment: 1 },
        total_items: { increment: totalItems },
      },
      create: {
        tenant_id: tenantId,
        date,
        total_sales: payload.total,
        total_orders: 1,
        total_items: totalItems,
      },
    });

    await this.prisma.hourlySale.upsert({
      where: { tenant_id_hour: { tenant_id: tenantId, hour } },
      update: {
        total_sales: { increment: payload.total },
        total_orders: { increment: 1 },
      },
      create: {
        tenant_id: tenantId,
        hour,
        total_sales: payload.total,
        total_orders: 1,
      },
    });
  }

  async getDailySales(tenantId: number, date?: string) {
    const where: any = { tenant_id: BigInt(tenantId) };
    if (date) {
      where.date = new Date(date);
    }
    return this.prisma.dailySale.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async getSummary(tenantId: number) {
    const rows = await this.prisma.dailySale.findMany({
      where: { tenant_id: BigInt(tenantId) },
    });
    const totalSales = rows.reduce((s, r) => s + Number(r.total_sales), 0);
    const totalOrders = rows.reduce((s, r) => s + r.total_orders, 0);
    return {
      tenant_id: tenantId,
      total_sales: totalSales,
      total_orders: totalOrders,
      days: rows.length,
    };
  }
}
