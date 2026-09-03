import { Module } from '@nestjs/common';
import { RabbitMqConsumer } from './rabbitmq.consumer';

@Module({
  providers: [RabbitMqConsumer],
  exports: [RabbitMqConsumer],
})
export class RabbitMqModule {}
