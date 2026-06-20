import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getSummary(user: any): Promise<{
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
    getForecast(user: any, page?: string, limit?: string): Promise<{
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
    seedSales(user: any, count?: number): Promise<{
        success: boolean;
        message: string;
    }>;
    recalculate(user: any): Promise<{
        message: string;
        count: number;
    }>;
}
