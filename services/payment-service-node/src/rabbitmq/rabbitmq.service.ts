import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMqService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMqService.name);
  private connection: any;
  private channel: any;
  private exchange = process.env.RABBITMQ_EXCHANGE || 'pos.events';
  private exchangeType = process.env.RABBITMQ_EXCHANGE_TYPE || 'topic';

  async onModuleInit() {
    try {
      const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}/${process.env.RABBITMQ_VHOST || ''}`;
      this.connection = await amqp.connect(url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchange, this.exchangeType, { durable: true });
      this.logger.log(`Connected to RabbitMQ (exchange ${this.exchange})`);
    } catch (err: any) {
      this.logger.error(`RabbitMQ connection failed: ${err.message}`);
    }
  }

  async publish(routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) {
      this.logger.warn('RabbitMQ channel not ready; dropping message');
      return false;
    }
    const payload = Buffer.from(JSON.stringify(message));
    return this.channel.publish(this.exchange, routingKey, payload, { persistent: true });
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
