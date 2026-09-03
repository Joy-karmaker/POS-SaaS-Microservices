import { Module } from '@nestjs/common';
import { PaymentEventsConsumer } from './payment-events.consumer';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [OrdersModule],
  providers: [PaymentEventsConsumer],
  exports: [PaymentEventsConsumer],
})
export class RabbitMqModule {}
