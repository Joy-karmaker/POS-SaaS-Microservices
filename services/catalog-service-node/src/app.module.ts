import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { InventoryModule } from './inventory/inventory.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [CategoryModule, ProductModule, InventoryModule, AnalyticsModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
