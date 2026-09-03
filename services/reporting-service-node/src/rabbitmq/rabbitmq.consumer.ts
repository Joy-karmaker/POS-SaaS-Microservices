import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';
import { PrismaService } from '../prisma/prisma.service';
import { ReportsService } from '../reports/reports.service';

@Injectable()
export class RabbitMqConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqConsumer.name);
  private connection: any;
  private channel: any;

  private exchange = process.env.RABBITMQ_EXCHANGE || 'pos.events';
  private exchangeType = process.env.RABBITMQ_EXCHANGE_TYPE || 'topic';
  private dlx = process.env.RABBITMQ_DLX || 'pos.events.dlx';
  private queue = process.env.RABBITMQ_QUEUE_SALE_COMPLETED_REPORTING || 'reporting.sale.completed';
  private routingKey = process.env.RABBITMQ_ROUTING_SALE_COMPLETED || 'sale.completed';

  constructor(
    private prisma: PrismaService,
    private reportsService: ReportsService,
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
      this.logger.error(`RabbitMQ consumer init failed: ${err.message}`);
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
      await this.reportsService.handleSaleCompleted(payload);
      this.channel.ack(msg);
    } catch (err: any) {
      this.logger.error(`Failed to process sale.completed: ${err.message}`);
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
