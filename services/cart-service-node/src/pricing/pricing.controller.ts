import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post('calculate')
  calculatePricing(
    @CurrentUser() user: any,
    @Body()
    body: {
      cartId?: string;
      items?: any[];
      discountCode?: string;
      discountPercentage?: number;
    },
  ) {
    return this.pricingService.calculatePricing(user.tenant_id, body);
  }
}
