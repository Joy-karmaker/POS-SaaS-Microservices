import { PrismaService } from '../prisma.service';
import { InventoryGateway } from '../inventory/inventory.gateway';
export declare class AnalyticsService {
    private prisma;
    private inventoryGateway;
    constructor(prisma: PrismaService, inventoryGateway: InventoryGateway);
    recalculateProductForecast(tenantId: number, productId: number, tx?: any): Promise<any>;
    recalculateAllProductsForecast(tenantId: number): Promise<{
        message: string;
        count: number;
    }>;
    getAnalyticsSummary(tenantId: number): Promise<{
        summary: {
            outOfStock: number;
            criticalRisk: number;
            lowRisk: number;
            stable: number;
        };
        topProduct: ({
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
        }) | null;
    }>;
    getForecastList(tenantId: number, page?: number, limit?: number): Promise<{
        data: ({
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
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    seedSimulationSales(tenantId: number, totalSales?: number): Promise<{
        success: boolean;
        message: string;
    }>;
}
declare global {
    interface Date {
        getFloatSeconds(): number;
        setFloatSeconds(seconds: number): void;
    }
}
