import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post('adjust')
  adjustStock(@CurrentUser() user: any, @Body() adjustStockDto: AdjustStockDto) {
    return this.inventoryService.adjustStock(user.tenant_id, adjustStockDto);
  }

  @Get(':productId')
  getStock(@CurrentUser() user: any, @Param('productId') productId: string) {
    return this.inventoryService.getStock(user.tenant_id, +productId);
  }
}
