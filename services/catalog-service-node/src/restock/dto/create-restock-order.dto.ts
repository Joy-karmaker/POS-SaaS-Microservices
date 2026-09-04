export class RestockItemDto {
  product_id: number;
  quantity: number;
  cost_price?: number;
}

export class CreateRestockOrderDto {
  warehouse_name?: string;
  notes?: string;
  items: RestockItemDto[];
}
