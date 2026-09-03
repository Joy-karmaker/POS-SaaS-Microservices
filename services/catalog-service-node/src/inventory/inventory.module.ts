import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryGateway } from './inventory.gateway';
import { InventorySaleConsumer } from './inventory-sale.consumer';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TenantModule],
  controllers: [InventoryController],
  providers: [InventoryService, InventoryGateway, InventorySaleConsumer],
  exports: [InventoryGateway, InventoryService],
})
export class InventoryModule {}
