import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { RestockService } from './restock.service';
import { CreateRestockOrderDto } from './dto/create-restock-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('restock')
export class RestockController {
  constructor(private readonly restockService: RestockService) {}

  @Post()
  create(@CurrentUser() user: any, @Body() dto: CreateRestockOrderDto) {
    return this.restockService.create(user.tenant_id, user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any, @Query('status') status?: string) {
    return this.restockService.findAll(user.tenant_id, { status });
  }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.restockService.findOne(user.tenant_id, +id);
  }

  @Post(':id/dispatch')
  dispatch(@CurrentUser() user: any, @Param('id') id: string) {
    return this.restockService.dispatch(user.tenant_id, +id);
  }

  @Post(':id/receive')
  receive(@CurrentUser() user: any, @Param('id') id: string) {
    return this.restockService.markReceived(user.tenant_id, +id);
  }

  @Post(':id/cancel')
  cancel(@CurrentUser() user: any, @Param('id') id: string) {
    return this.restockService.cancel(user.tenant_id, +id);
  }

  @Post(':id/mark-paid')
  markPaid(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() body: { payment_id?: number | string; gateway?: string; amount?: number },
  ) {
    return this.restockService.markPaid(user.tenant_id, +id, body);
  }
}
