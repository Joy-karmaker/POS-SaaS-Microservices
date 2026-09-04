export type PaymentPurpose = 'POS_SALE' | 'RESTOCK_ORDER';
export type PaymentMethod = 'CASH' | 'CARD' | 'MFS' | 'STRIPE' | 'SSLCOMMERZ';

export interface CreatePaymentInput {
  tenantId: number;
  paymentId: number | bigint;
  purpose: PaymentPurpose;
  referenceId?: string;
  amount: number;
  amountCents: bigint | number;
  currency: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  returnUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentSessionResult {
  gateway: string;
  gatewayRef: string;
  status: 'PENDING' | 'SUCCESS' | 'REQUIRES_ACTION';
  redirectUrl?: string;
  clientSecret?: string;
  rawResponse?: any;
}

export interface VerifyPaymentInput {
  tenantId: number;
  paymentId: number | bigint;
  gatewayRef?: string;
  verificationData?: any;
}

export interface PaymentVerificationResult {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  gatewayRef: string;
  amount?: number;
  currency?: string;
  paymentMethodDetails?: string;
  errorMessage?: string;
  rawResponse?: any;
}

export interface IPaymentGateway {
  readonly gatewayName: string;
  createPayment(input: CreatePaymentInput): Promise<PaymentSessionResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<PaymentVerificationResult>;
}
