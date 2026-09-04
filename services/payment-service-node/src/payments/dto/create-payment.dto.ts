export class CreatePaymentItemDto {
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
}

export class CreatePaymentDto {
  order_id?: number;
  method: string; // CASH | CARD | MFS
  amount: number;
  idempotency_key?: string;

  // Direct checkout parameters from Cart
  items?: CreatePaymentItemDto[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
}
