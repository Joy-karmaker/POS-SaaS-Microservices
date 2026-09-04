import { Module } from '@nestjs/common';
import { RestockService } from './restock.service';
import { RestockController } from './restock.controller';
import { TenantModule } from '../tenant/tenant.module';
import { InventoryModule } from '../inventory/inventory.module';

import { RestockPaymentConsumer } from './restock-payment.consumer';

@Module({
  imports: [TenantModule, InventoryModule],
  controllers: [RestockController],
  providers: [RestockService, RestockPaymentConsumer],
  exports: [RestockService],
})
export class RestockModule {}
