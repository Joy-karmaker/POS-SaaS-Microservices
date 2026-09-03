import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private tenantConnectionService: TenantConnectionService,
    private rabbitMqService: RabbitMqService,
  ) {}

  async pay(tenantId: number, user: any, dto: CreatePaymentDto) {
    const client = await this.tenantConnectionService.getClient(tenantId);

    // 1. Idempotency: duplicate Idempotency-Key returns the original payment.
    if (dto.idempotency_key) {
      const existing = await client.payment.findUnique({
        where: { idempotency_key: dto.idempotency_key },
      });
      if (existing) {
        return { ...existing, idempotent: true };
      }
    }

    // 2. Load the order (scoped to the tenant DB).
    const order = await client.order.findUnique({
      where: { id: dto.order_id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order #${dto.order_id} not found`);
    }

    if (order.status === 'PAID') {
      throw new BadRequestException(`Order #${dto.order_id} is already paid`);
    }

    // 3. MVP gateway simulation: cash/card/local MFS are approved immediately.
    //    Real gateway webhooks would update payment status asynchronously.
    const payment = await client.payment.create({
      data: {
        order_id: dto.order_id,
        method: dto.method,
        amount: dto.amount,
        status: 'SUCCESS',
        idempotency_key: dto.idempotency_key ?? null,
        gateway_ref: `sim_${randomUUID()}`,
      },
    });

    // 4. Mark order as paid (shared tenant DB).
    await client.order.update({
      where: { id: dto.order_id },
      data: { status: 'PAID' },
    });

    // 5. Publish domain events for downstream consumers.
    const eventId = randomUUID();
    const occurredAt = new Date().toISOString();

    const saleCompleted = {
      event_id: eventId,
      event_type: 'sale.completed',
      tenant_id: tenantId,
      store_id: order.store_id ? Number(order.store_id) : null,
      user_id: order.user_id ? Number(order.user_id) : null,
      order_id: order.id,
      total: Number(order.total),
      tax: Number(order.tax),
      discount: Number(order.discount),
      items: order.items.map((i: any) => ({
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price: Number(i.unit_price),
      })),
      payment_method: dto.method,
      occurred_at: occurredAt,
    };

    await this.rabbitMqService.publish(
      process.env.RABBITMQ_ROUTING_SALE_COMPLETED || 'sale.completed',
      saleCompleted,
    );
    await this.rabbitMqService.publish(
      process.env.RABBITMQ_ROUTING_PAYMENT_COMPLETED || 'payment.completed',
      { ...saleCompleted, event_type: 'payment.completed' },
    );

    return payment;
  }

  async findByTenant(tenantId: number) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    return client.payment.findMany({
      orderBy: { id: 'desc' },
    });
  }
}
