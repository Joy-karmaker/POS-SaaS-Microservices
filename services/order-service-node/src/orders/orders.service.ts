import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private tenantConnectionService: TenantConnectionService) {}

  async create(tenantId: number, user: any, dto: CreateOrderDto) {
    const client = await this.tenantConnectionService.getClient(tenantId);

    const order = await client.order.create({
      data: {
        store_id: dto.store_id ? BigInt(dto.store_id) : user.store_id ? BigInt(user.store_id) : null,
        user_id: user.id ? BigInt(user.id) : null,
        shift_id: dto.shift_id ? BigInt(dto.shift_id) : null,
        status: 'PENDING',
        subtotal: dto.subtotal,
        tax: dto.tax ?? 0,
        discount: dto.discount ?? 0,
        total: dto.total,
        items: {
          create: dto.items.map((i) => ({
            product_id: i.product_id,
            product_name: i.product_name,
            quantity: i.quantity,
            unit_price: i.unit_price,
            total_price: i.unit_price * i.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return order;
  }

  async findOne(tenantId: number, id: number) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    const order = await client.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    return order;
  }

  async findByTenant(tenantId: number, filters?: { status?: string; storeId?: number | string }) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    const where: any = {};
    if (filters?.status && filters.status !== 'ALL') {
      where.status = filters.status;
    }
    if (filters?.storeId) {
      where.store_id = BigInt(filters.storeId);
    }

    return client.order.findMany({
      where,
      include: { items: true },
      orderBy: { id: 'desc' },
    });
  }

  async markPaid(tenantId: number, id: number) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    const existing = await client.order.findUnique({ where: { id } });
    if (!existing) {
      this.logger.warn(`Cannot mark order #${id} as PAID: order not found for tenant #${tenantId}`);
      return null;
    }
    if (existing.status === 'PAID') {
      this.logger.log(`Order #${id} is already marked as PAID`);
      return existing;
    }

    const updated = await client.order.update({
      where: { id },
      data: { status: 'PAID' },
      include: { items: true },
    });
    this.logger.log(`Order #${id} marked as PAID for tenant #${tenantId}`);
    return updated;
  }

  async markFailed(tenantId: number, id: number, reason?: string) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    const existing = await client.order.findUnique({ where: { id } });
    if (!existing) {
      this.logger.warn(`Cannot mark order #${id} as PAYMENT_FAILED: order not found for tenant #${tenantId}`);
      return null;
    }
    if (existing.status === 'PAID') {
      this.logger.warn(`Order #${id} is already PAID, ignoring payment failed event`);
      return existing;
    }

    const updated = await client.order.update({
      where: { id },
      data: { status: 'PAYMENT_FAILED' },
      include: { items: true },
    });
    this.logger.log(`Order #${id} marked as PAYMENT_FAILED for tenant #${tenantId}. Reason: ${reason || 'Declined'}`);
    return updated;
  }

  async cancelOrder(tenantId: number, id: number) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    const existing = await client.order.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Order #${id} not found`);
    }
    if (existing.status === 'PAID') {
      throw new Error(`Cannot cancel Order #${id} because it is already PAID`);
    }

    const updated = await client.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: true },
    });
    this.logger.log(`Order #${id} marked as CANCELLED for tenant #${tenantId}`);
    return updated;
  }
}

