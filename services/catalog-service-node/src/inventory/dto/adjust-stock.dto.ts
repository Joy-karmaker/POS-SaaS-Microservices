export class AdjustStockDto {
  product_id: number;
  quantity_change: number; // Positive to add stock, negative to reduce
  reason?: string;
}
