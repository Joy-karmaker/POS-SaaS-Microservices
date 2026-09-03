import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  pay(@CurrentUser() user: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.pay(user.tenant_id, user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.paymentsService.findByTenant(user.tenant_id);
  }
}
