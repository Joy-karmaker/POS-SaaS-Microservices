import { PaymentPurpose } from '../gateways/payment-gateway.interface';

export class PaymentLineItemDto {
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
}

export class InitiatePaymentDto {
  purpose?: PaymentPurpose; // 'POS_SALE' | 'RESTOCK_ORDER' (defaults to POS_SALE)
  reference_id?: string | number;
  order_id?: number;
  restock_order_id?: number;

  method: string; // 'CASH' | 'CARD' | 'MFS' | 'STRIPE' | 'SSLCOMMERZ'
  gateway?: string; // 'CASH' | 'STRIPE' | 'SSLCOMMERZ'
  amount: number;
  currency?: string; // 'BDT' | 'USD'
  idempotency_key?: string;

  // Line items (for POS sales or Restock orders)
  items?: PaymentLineItemDto[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;

  // Restock info
  warehouse_name?: string;

  // Customer or store manager info
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  notes?: string;
}

export class VerifyPaymentDto {
  payment_id: number | string;
  gateway?: string;
  gateway_ref?: string;
  verification_data?: any;
}
