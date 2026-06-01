import { Module } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { InventoryController } from './inventory.controller';
import { InventoryGateway } from './inventory.gateway';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [InventoryController],
  providers: [InventoryService, InventoryGateway, PrismaService],
  exports: [InventoryGateway],
})
export class InventoryModule {}
