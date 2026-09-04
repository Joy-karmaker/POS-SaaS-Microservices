import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { RabbitMqService } from '../rabbitmq/rabbitmq.service';
import { OutboxService } from './outbox/outbox.service';
import { GatewayRegistry } from './gateways/gateway.registry';
import { PaymentPurpose } from './gateways/payment-gateway.interface';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/initiate-payment.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private tenantConnectionService: TenantConnectionService,
    private rabbitMqService: RabbitMqService,
    private outboxService: OutboxService,
    private gatewayRegistry: GatewayRegistry,
  ) {}

  /**
   * Initiates a payment session for either a POS retail sale or Warehouse restock purchase order.
   */
  async initiate(tenantId: number, user: any, dto: InitiatePaymentDto) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    this.outboxService.registerTenant(tenantId);

    // 1. Idempotency Check
    if (dto.idempotency_key) {
      const existing = await client.payment.findUnique({
        where: { idempotency_key: dto.idempotency_key },
      });
      if (existing) {
        return {
          ...this.serializePayment(existing),
          idempotent: true,
        };
      }
    }

    // 2. Resolve Purpose and Reference
    const purpose: PaymentPurpose = dto.purpose || (dto.restock_order_id ? 'RESTOCK_ORDER' : 'POS_SALE');
    const referenceId = String(
      dto.reference_id ||
      dto.order_id ||
      dto.restock_order_id ||
      `REF-${Date.now()}`
    );

    // 3. Resolve Gateway
    const gatewayName = (dto.gateway || dto.method || 'CASH').toUpperCase();
    const gateway = this.gatewayRegistry.getGateway(gatewayName);

    // 4. Monetary Minor Units Calculation (Cents / Poisha)
    const amount = Number(dto.total ?? dto.amount);
    if (!amount || amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than 0');
    }
    const currency = (dto.currency || (gateway.gatewayName === 'STRIPE' ? 'USD' : 'BDT')).toUpperCase();
    const amountCents = BigInt(Math.round(amount * 100));

    // 5. Build Metadata
    const metadata = {
      items: dto.items || [],
      subtotal: dto.subtotal ?? amount,
      tax: dto.tax ?? 0,
      discount: dto.discount ?? 0,
      warehouse_name: dto.warehouse_name,
      customer_name: dto.customer_name,
      notes: dto.notes,
      user_id: user?.id,
      store_id: user?.store_id,
      initiated_at: new Date().toISOString(),
    };

    // 6. Persist Initial Payment in DB
    const initialPayment = await client.payment.create({
      data: {
        order_id: dto.order_id ? Number(dto.order_id) : null,
        purpose,
        reference_id: referenceId,
        method: dto.method || gateway.gatewayName,
        gateway: gateway.gatewayName,
        amount: amount,
        amount_cents: amountCents,
        currency,
        status: 'PENDING',
        idempotency_key: dto.idempotency_key ?? null,
        metadata: JSON.stringify(metadata),
      },
    });

    const paymentId = Number(initialPayment.id);
    const receiptNumber = `REC-${String(paymentId).padStart(6, '0')}`;

    // 7. Invoke Gateway Adapter
    const sessionResult = await gateway.createPayment({
      tenantId,
      paymentId,
      purpose,
      referenceId,
      amount,
      amountCents,
      currency,
      customerName: dto.customer_name || user?.username,
      customerEmail: dto.customer_email || user?.email,
      customerPhone: dto.customer_phone,
      description: `${purpose === 'RESTOCK_ORDER' ? 'Restock Purchase Order' : 'POS Checkout'} #${referenceId}`,
      metadata,
    });

    // 8. Log Payment Attempt
    await client.paymentAttempt.create({
      data: {
        payment_id: initialPayment.id,
        attempt_number: 1,
        gateway: gateway.gatewayName,
        gateway_ref: sessionResult.gatewayRef,
        status: sessionResult.status,
        request_payload: JSON.stringify({ amount, currency, purpose, referenceId }),
        response_payload: JSON.stringify(sessionResult.rawResponse || {}),
      },
    });

    // 9. Update Payment with Gateway Session Info
    const finalStatus = sessionResult.status === 'SUCCESS' ? 'SUCCESS' : 'PENDING';
    const updatedPayment = await client.payment.update({
      where: { id: initialPayment.id },
      data: {
        gateway_ref: sessionResult.gatewayRef,
        client_secret: sessionResult.clientSecret ?? null,
        status: finalStatus,
        receipt_number: receiptNumber,
      },
    });

    // 10. If Instant Settlement (e.g. Cash), trigger Outbox domain events immediately
    if (finalStatus === 'SUCCESS') {
      await this.publishSettlementEvents(tenantId, user, updatedPayment, metadata);
    }

    return {
      ...this.serializePayment(updatedPayment),
      redirect_url: sessionResult.redirectUrl,
      client_secret: sessionResult.clientSecret,
    };
  }

  /**
   * Verifies and settles a pending payment session (called via IPN, Webhook, or client verify).
   */
  async verifyAndSettle(tenantId: number, user: any, dto: VerifyPaymentDto) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    this.outboxService.registerTenant(tenantId);

    const payment = await client.payment.findUnique({
      where: { id: BigInt(dto.payment_id) },
    });

    if (!payment) {
      throw new NotFoundException(`Payment #${dto.payment_id} not found`);
    }

    if (payment.status === 'SUCCESS') {
      return {
        ...this.serializePayment(payment),
        message: 'Payment already completed and settled',
      };
    }

    const gatewayName = dto.gateway || payment.gateway || payment.method;
    const gateway = this.gatewayRegistry.getGateway(gatewayName);

    // Verify with gateway
    const verification = await gateway.verifyPayment({
      tenantId,
      paymentId: payment.id,
      gatewayRef: dto.gateway_ref || payment.gateway_ref || undefined,
      verificationData: dto.verification_data,
    });

    // Record attempt
    await client.paymentAttempt.create({
      data: {
        payment_id: payment.id,
        gateway: gateway.gatewayName,
        gateway_ref: verification.gatewayRef || payment.gateway_ref,
        status: verification.status,
        request_payload: JSON.stringify(dto.verification_data || {}),
        response_payload: JSON.stringify(verification.rawResponse || {}),
        error_message: verification.errorMessage || null,
      },
    });

    if (!verification.success || verification.status !== 'SUCCESS') {
      await client.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' },
      });
      throw new BadRequestException(verification.errorMessage || 'Payment verification failed at gateway');
    }

    // Payment Succeeded! Update state and settle.
    const updatedPayment = await client.payment.update({
      where: { id: payment.id },
      data: {
        status: 'SUCCESS',
        gateway_ref: verification.gatewayRef || payment.gateway_ref,
      },
    });

    let metadata: any = {};
    try {
      metadata = payment.metadata ? JSON.parse(payment.metadata) : {};
    } catch {}

    await this.publishSettlementEvents(tenantId, user, updatedPayment, metadata);

    return {
      ...this.serializePayment(updatedPayment),
      verification_details: verification.paymentMethodDetails,
    };
  }

  /**
   * Publishes domain events to Transactional Outbox for downstream microservices.
   */
  private async publishSettlementEvents(
    tenantId: number,
    user: any,
    payment: any,
    metadata: any,
  ) {
    const occurredAt = new Date().toISOString();
    const eventId = randomUUID();

    if (payment.purpose === 'RESTOCK_ORDER') {
      // Event: restock.paid -> consumed by catalog-service to mark purchase order PAID
      const restockPaidEvent = {
        event_id: eventId,
        event_type: 'restock.paid',
        tenant_id: tenantId,
        restock_order_id: Number(payment.reference_id),
        payment_id: Number(payment.id),
        amount: Number(payment.amount),
        currency: payment.currency,
        gateway: payment.gateway,
        gateway_ref: payment.gateway_ref,
        receipt_number: payment.receipt_number,
        warehouse_name: metadata?.warehouse_name,
        occurred_at: occurredAt,
      };

      await this.outboxService.recordEvent(tenantId, {
        aggregateType: 'RESTOCK_ORDER',
        aggregateId: String(payment.reference_id),
        eventType: process.env.RABBITMQ_ROUTING_RESTOCK_PAID || 'restock.paid',
        payload: restockPaidEvent,
      });

      this.logger.log(`Queued outbox event 'restock.paid' for Restock Order #${payment.reference_id}`);
    } else {
      // Event: sale.completed -> consumed by catalog-service to deduct inventory stock
      const saleCompletedEvent = {
        event_id: eventId,
        event_type: 'sale.completed',
        tenant_id: tenantId,
        store_id: metadata?.store_id || (user?.store_id ? Number(user.store_id) : null),
        user_id: metadata?.user_id || (user?.id ? Number(user.id) : null),
        order_id: payment.order_id ? Number(payment.order_id) : Number(payment.id),
        payment_id: Number(payment.id),
        total: Number(payment.amount),
        tax: Number(metadata?.tax || 0),
        discount: Number(metadata?.discount || 0),
        items: (metadata?.items || []).map((i: any) => ({
          product_id: i.product_id,
          quantity: i.quantity,
          unit_price: Number(i.unit_price),
        })),
        payment_method: payment.method,
        payment_gateway: payment.gateway,
        gateway_ref: payment.gateway_ref,
        receipt_number: payment.receipt_number,
        occurred_at: occurredAt,
      };

      await this.outboxService.recordEvent(tenantId, {
        aggregateType: 'POS_SALE',
        aggregateId: String(payment.id),
        eventType: process.env.RABBITMQ_ROUTING_SALE_COMPLETED || 'sale.completed',
        payload: saleCompletedEvent,
      });

      this.logger.log(`Queued outbox event 'sale.completed' for Payment #${payment.id}`);
    }
  }

  /**
   * Backward-compatible payment handler for legacy callers.
   */
  async pay(tenantId: number, user: any, dto: CreatePaymentDto) {
    const initiateDto: InitiatePaymentDto = {
      purpose: 'POS_SALE',
      order_id: dto.order_id,
      method: dto.method,
      amount: dto.amount,
      idempotency_key: dto.idempotency_key,
      items: dto.items,
      subtotal: dto.subtotal,
      tax: dto.tax,
      discount: dto.discount,
      total: dto.total,
    };
    return this.initiate(tenantId, user, initiateDto);
  }

  async findByTenant(tenantId: number) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    const list = await client.payment.findMany({
      orderBy: { id: 'desc' },
      take: 100,
    });
    return list.map((p) => this.serializePayment(p));
  }

  async findOne(tenantId: number, paymentId: number | bigint) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    const payment = await client.payment.findUnique({
      where: { id: BigInt(paymentId) },
    });
    if (!payment) {
      throw new NotFoundException(`Payment #${paymentId} not found`);
    }
    return this.serializePayment(payment);
  }

  private serializePayment(payment: any) {
    return {
      ...payment,
      id: Number(payment.id),
      order_id: payment.order_id ? Number(payment.order_id) : null,
      amount: Number(payment.amount),
      amount_cents: payment.amount_cents ? String(payment.amount_cents) : undefined,
    };
  }
}
