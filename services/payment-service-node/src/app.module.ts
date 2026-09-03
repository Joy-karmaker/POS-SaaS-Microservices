import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantModule } from './tenant/tenant.module';
import { PaymentsModule } from './payments/payments.module';
import { RabbitMqModule } from './rabbitmq/rabbitmq.module';

@Module({
  imports: [TenantModule, PaymentsModule, RabbitMqModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
