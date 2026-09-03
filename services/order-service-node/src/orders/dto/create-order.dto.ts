export class OrderItemDto {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export class CreateOrderDto {
  store_id?: number;
  shift_id?: number;
  items: OrderItemDto[];
  subtotal: number;
  tax?: number;
  discount?: number;
  total: number;
}
