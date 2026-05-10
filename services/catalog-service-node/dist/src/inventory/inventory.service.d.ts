import { PrismaService } from '../prisma.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
export declare class InventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    adjustStock(tenantId: number, adjustStockDto: AdjustStockDto): Promise<{
        name: string;
        tenant_id: number;
        created_at: Date;
        updated_at: Date;
        id: number;
        category_id: number | null;
        sku: string | null;
        barcode: string | null;
        price: import("@prisma/client-runtime-utils").Decimal;
        cost_price: import("@prisma/client-runtime-utils").Decimal | null;
        stock_quantity: number;
        is_active: boolean;
    }>;
    getStock(tenantId: number, productId: number): Promise<{
        name: string;
        id: number;
        stock_quantity: number;
    }>;
}
