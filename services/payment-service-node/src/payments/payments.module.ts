import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TenantModule } from '../tenant/tenant.module';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';
import { CashGateway } from './gateways/cash.gateway';
import { StripeGateway } from './gateways/stripe.gateway';
import { SSLCommerzGateway } from './gateways/sslcommerz.gateway';
import { GatewayRegistry } from './gateways/gateway.registry';
import { OutboxService } from './outbox/outbox.service';

@Module({
  imports: [TenantModule, RabbitMqModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    CashGateway,
    StripeGateway,
    SSLCommerzGateway,
    GatewayRegistry,
    OutboxService,
  ],
  exports: [PaymentsService, OutboxService],
})
export class PaymentsModule {}
