import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Headers,
  Req,
  Res,
  Logger,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { InitiatePaymentDto, VerifyPaymentDto } from './dto/initiate-payment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Initiate a payment session for POS Sale or Warehouse Restock.
   */
  @UseGuards(JwtAuthGuard)
  @Post('initiate')
  initiate(@CurrentUser() user: any, @Body() dto: InitiatePaymentDto) {
    return this.paymentsService.initiate(user.tenant_id, user, dto);
  }

  /**
   * Verify and settle a payment (called after client completes Stripe Elements or SSLCOMMERZ redirect).
   */
  @UseGuards(JwtAuthGuard)
  @Post('verify')
  verify(@CurrentUser() user: any, @Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyAndSettle(user.tenant_id, user, dto);
  }

  /**
   * Legacy checkout endpoint (backward compatibility with existing POS).
   */
  @UseGuards(JwtAuthGuard)
  @Post()
  pay(@CurrentUser() user: any, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.pay(user.tenant_id, user, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@CurrentUser() user: any) {
    return this.paymentsService.findByTenant(user.tenant_id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) {
    return this.paymentsService.findOne(user.tenant_id, +id);
  }

  /**
   * SSLCOMMERZ IPN Webhook listener (Public, verified via validation server API).
   */
  @Post('webhooks/sslcommerz/ipn')
  async sslcommerzIpn(@Body() body: any) {
    this.logger.log(`Received SSLCOMMERZ IPN callback: tran_id=${body?.tran_id}, val_id=${body?.val_id}`);
    const tenantId = Number(body?.value_a);
    const paymentId = body?.value_b;

    if (!tenantId || !paymentId) {
      this.logger.warn('SSLCOMMERZ IPN missing value_a (tenantId) or value_b (paymentId)');
      return { status: 'IGNORED' };
    }

    return this.paymentsService.verifyAndSettle(tenantId, null, {
      payment_id: paymentId,
      gateway: 'SSLCOMMERZ',
      gateway_ref: body?.tran_id,
      verification_data: body,
    });
  }

  /**
   * SSLCOMMERZ Browser Redirect Success listener.
   */
  @Post('webhooks/sslcommerz/success')
  async sslcommerzSuccess(@Body() body: any, @Res() res: any) {
    this.logger.log(`Received SSLCOMMERZ success redirect for tran_id: ${body?.tran_id}`);
    const tenantId = Number(body?.value_a);
    const paymentId = body?.value_b;

    if (tenantId && paymentId) {
      try {
        await this.paymentsService.verifyAndSettle(tenantId, null, {
          payment_id: paymentId,
          gateway: 'SSLCOMMERZ',
          gateway_ref: body?.tran_id,
          verification_data: body,
        });
      } catch (err: any) {
        this.logger.warn(`SSLCOMMERZ redirect verification warning: ${err.message}`);
      }
    }

    // Redirect user back to frontend confirmation page
    const purpose = body?.value_c || 'POS_SALE';
    const redirectPath = purpose === 'RESTOCK_ORDER' ? '/tenant/restock' : '/tenant/pos';
    return res.redirect(`${redirectPath}?payment_status=success&payment_id=${paymentId}`);
  }

  /**
   * Stripe Webhook listener (Public, verified via Stripe event metadata).
   */
  @Post('webhooks/stripe')
  async stripeWebhook(@Body() body: any, @Headers('stripe-signature') signature: string) {
    this.logger.log(`Received Stripe Webhook event: ${body?.type}`);
    if (body?.type === 'payment_intent.succeeded') {
      const pi = body.data?.object;
      const tenantId = Number(pi?.metadata?.tenant_id);
      const paymentId = pi?.metadata?.payment_id;

      if (tenantId && paymentId) {
        return this.paymentsService.verifyAndSettle(tenantId, null, {
          payment_id: paymentId,
          gateway: 'STRIPE',
          gateway_ref: pi.id,
          verification_data: pi,
        });
      }
    }

    return { received: true };
  }
}
