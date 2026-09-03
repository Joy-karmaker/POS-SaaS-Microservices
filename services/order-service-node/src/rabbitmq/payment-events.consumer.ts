import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentEventsConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentEventsConsumer.name);
  private connection: any;
  private channel: any;

  private exchange = process.env.RABBITMQ_EXCHANGE || 'pos.events';
  private exchangeType = process.env.RABBITMQ_EXCHANGE_TYPE || 'topic';
  private dlx = process.env.RABBITMQ_DLX || 'pos.events.dlx';
  private queue = process.env.RABBITMQ_QUEUE_PAYMENT_COMPLETED_ORDER || 'order.payment.events';

  private routingPaymentCompleted = process.env.RABBITMQ_ROUTING_PAYMENT_COMPLETED || 'payment.completed';
  private routingPaymentFailed = process.env.RABBITMQ_ROUTING_PAYMENT_FAILED || 'payment.failed';

  constructor(private readonly ordersService: OrdersService) {}

  async onModuleInit() {
    this.connectWithRetry();
  }

  private async connectWithRetry(retries = 10, delayMs = 4000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const host = process.env.RABBITMQ_HOST || 'rabbitmq';
        const port = process.env.RABBITMQ_PORT || 5672;
        const user = process.env.RABBITMQ_USER || 'guest';
        const password = process.env.RABBITMQ_PASSWORD || 'guest';
        const vhost = process.env.RABBITMQ_VHOST || '';

        const url = `amqp://${user}:${password}@${host}:${port}/${vhost}`;
        this.connection = await amqp.connect(url);
        this.channel = await this.connection.createChannel();

        await this.channel.assertExchange(this.exchange, this.exchangeType, { durable: true });
        await this.channel.assertExchange(this.dlx, 'topic', { durable: true });

        await this.channel.assertQueue(this.queue, {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': this.dlx,
            'x-dead-letter-routing-key': `${this.queue}.dlq`,
          },
        });

        await this.channel.bindQueue(this.queue, this.exchange, this.routingPaymentCompleted);
        await this.channel.bindQueue(this.queue, this.exchange, this.routingPaymentFailed);

        await this.channel.consume(this.queue, (msg: any) => this.handle(msg), { noAck: false });
        this.logger.log(`Consuming payment events on queue ${this.queue}`);
        return;
      } catch (err: any) {
        this.logger.warn(`RabbitMQ consumer connection attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${delayMs / 1000}s...`);
        if (attempt === retries) {
          this.logger.error(`RabbitMQ consumer connection failed permanently after ${retries} attempts: ${err.message}`);
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  private async handle(msg: any) {
    if (!msg) return;
    let payload: any;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch {
      this.channel.nack(msg, false, false);
      return;
    }

    const routingKey = msg.fields?.routingKey || '';
    this.logger.log(`Received event [${routingKey}] for order #${payload.order_id}, tenant #${payload.tenant_id}`);

    try {
      if (routingKey === this.routingPaymentCompleted || payload.event_type === 'payment.completed') {
        await this.ordersService.markPaid(Number(payload.tenant_id), Number(payload.order_id));
      } else if (routingKey === this.routingPaymentFailed || payload.event_type === 'payment.failed') {
        await this.ordersService.markFailed(Number(payload.tenant_id), Number(payload.order_id), payload.reason);
      }
      this.channel.ack(msg);
    } catch (err: any) {
      this.logger.error(`Failed to handle ${routingKey} for order #${payload?.order_id}: ${err.message}`);
      this.channel.nack(msg, false, false);
    }
  }

  async onModuleDestroy() {
    try {
      await this.channel?.close();
    } catch {}
    try {
      await this.connection?.close();
    } catch {}
  }
}
