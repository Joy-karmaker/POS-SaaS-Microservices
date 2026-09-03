import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { TenantModule } from '../tenant/tenant.module';
import { RabbitMqModule } from '../rabbitmq/rabbitmq.module';

@Module({
  imports: [TenantModule, RabbitMqModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
