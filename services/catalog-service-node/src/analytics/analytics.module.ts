import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [InventoryModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, PrismaService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
