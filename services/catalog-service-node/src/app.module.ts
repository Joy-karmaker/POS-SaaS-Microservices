import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TenantModule } from './tenant/tenant.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { InventoryModule } from './inventory/inventory.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { RestockModule } from './restock/restock.module';

@Module({
  imports: [TenantModule, CategoryModule, ProductModule, InventoryModule, AnalyticsModule, RestockModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
