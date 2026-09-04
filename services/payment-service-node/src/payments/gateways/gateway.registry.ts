import { Injectable, BadRequestException } from '@nestjs/common';
import { IPaymentGateway } from './payment-gateway.interface';
import { CashGateway } from './cash.gateway';
import { StripeGateway } from './stripe.gateway';
import { SSLCommerzGateway } from './sslcommerz.gateway';

@Injectable()
export class GatewayRegistry {
  private readonly gateways = new Map<string, IPaymentGateway>();

  constructor(
    private cashGateway: CashGateway,
    private stripeGateway: StripeGateway,
    private sslCommerzGateway: SSLCommerzGateway,
  ) {
    this.gateways.set('CASH', this.cashGateway);
    this.gateways.set('STRIPE', this.stripeGateway);
    this.gateways.set('CARD', this.stripeGateway); // Default card to Stripe
    this.gateways.set('SSLCOMMERZ', this.sslCommerzGateway);
    this.gateways.set('MFS', this.sslCommerzGateway); // Default MFS (bKash/Nagad) to SSLCOMMERZ
  }

  getGateway(nameOrMethod: string): IPaymentGateway {
    const key = (nameOrMethod || 'CASH').toUpperCase();
    const gateway = this.gateways.get(key);
    if (!gateway) {
      throw new BadRequestException(`Unsupported payment gateway or method: '${nameOrMethod}'`);
    }
    return gateway;
  }
}
