import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [CategoryModule, ProductModule, InventoryModule],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
