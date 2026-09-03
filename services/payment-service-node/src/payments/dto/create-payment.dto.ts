export class CreatePaymentDto {
  order_id: number;
  method: string; // CASH | CARD | BKASH | NAGAD
  amount: number;
  idempotency_key?: string;
}
