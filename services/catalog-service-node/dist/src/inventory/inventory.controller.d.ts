import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    adjustStock(user: any, adjustStockDto: AdjustStockDto): Promise<{
        category: {
            id: number;
            tenant_id: number;
            name: string;
            description: string | null;
            created_at: Date;
            updated_at: Date;
        } | null;
    } & {
        id: number;
        tenant_id: number;
        name: string;
        created_at: Date;
        updated_at: Date;
        sku: string | null;
        barcode: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        cost_price: import("@prisma/client-runtime-utils").Decimal | null;
        stock_quantity: number;
        is_active: boolean;
        sales_velocity: import("@prisma/client-runtime-utils").Decimal;
        stock_out_date: Date | null;
        category_id: number | null;
    }>;
    getStock(user: any, productId: string): Promise<{
        id: number;
        name: string;
        stock_quantity: number;
    }>;
}
