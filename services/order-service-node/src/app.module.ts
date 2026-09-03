import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantModule } from './tenant/tenant.module';
import { OrdersModule } from './orders/orders.module';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [TenantModule, OrdersModule, RabbitMqModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
