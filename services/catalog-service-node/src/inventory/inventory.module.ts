import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryGateway } from './inventory.gateway';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryGateway],
  exports: [InventoryGateway, InventoryService],
})
export class InventoryModule {}
