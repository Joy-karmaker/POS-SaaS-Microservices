import { Injectable, Logger } from '@nestjs/common';
import {
  IPaymentGateway,
  CreatePaymentInput,
  PaymentSessionResult,
  VerifyPaymentInput,
  PaymentVerificationResult,
} from './payment-gateway.interface';

@Injectable()
export class CashGateway implements IPaymentGateway {
  readonly gatewayName = 'CASH';
  private readonly logger = new Logger(CashGateway.name);

  async createPayment(input: CreatePaymentInput): Promise<PaymentSessionResult> {
    const gatewayRef = `cash_${input.paymentId}_${Date.now()}`;
    this.logger.log(`Cash settlement created: ${gatewayRef} for amount ${input.amount} ${input.currency}`);
    return {
      gateway: this.gatewayName,
      gatewayRef,
      status: 'SUCCESS',
      rawResponse: { type: 'CASH', settledAt: new Date().toISOString() },
    };
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult> {
    return {
      success: true,
      status: 'SUCCESS',
      gatewayRef: input.gatewayRef || `cash_${input.paymentId}`,
      amount: undefined,
      paymentMethodDetails: 'In-Store Physical Cash Tendered',
    };
  }
}
