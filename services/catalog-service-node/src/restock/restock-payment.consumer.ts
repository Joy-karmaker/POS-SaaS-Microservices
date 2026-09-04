import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { RestockService } from './restock.service';

@Injectable()
export class RestockPaymentConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RestockPaymentConsumer.name);
  private connection: any;
  private channel: any;

  private exchange = process.env.RABBITMQ_EXCHANGE || 'pos.events';
  private exchangeType = process.env.RABBITMQ_EXCHANGE_TYPE || 'topic';
  private dlx = process.env.RABBITMQ_DLX || 'pos.events.dlx';
  private queue = process.env.RABBITMQ_QUEUE_RESTOCK_PAID_CATALOG || 'catalog.restock.paid';
  private routingKey = process.env.RABBITMQ_ROUTING_RESTOCK_PAID || 'restock.paid';
  private consumer = 'catalog.restock.paid';

  constructor(
    private tenant: TenantConnectionService,
    private restockService: RestockService,
  ) {}

  async onModuleInit() {
    try {
      const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}/${process.env.RABBITMQ_VHOST || ''}`;
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
      await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);

      await this.channel.consume(this.queue, (msg: any) => this.handle(msg), { noAck: false });
      this.logger.log(`Consuming ${this.routingKey} on queue ${this.queue}`);
    } catch (err: any) {
      this.logger.error(`Restock payment consumer init failed: ${err.message}`);
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

    try {
      if (await this.tenant.isProcessed(this.consumer, payload.event_id)) {
        this.channel.ack(msg);
        return;
      }

      const restockOrderId = Number(payload.restock_order_id);
      if (restockOrderId && payload.tenant_id) {
        await this.restockService.markPaid(payload.tenant_id, restockOrderId, {
          payment_id: payload.payment_id,
          gateway: payload.gateway,
          amount: payload.amount,
        });
        this.logger.log(`Restock Order #${restockOrderId} marked PAID from event ${payload.event_id}`);
      }

      await this.tenant.markProcessed(this.consumer, payload.event_id);
      this.channel.ack(msg);
    } catch (err: any) {
      this.logger.error(`Failed to handle restock.paid event ${payload.event_id}: ${err.message}`);
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
