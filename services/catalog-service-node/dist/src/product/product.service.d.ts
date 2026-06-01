import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InventoryGateway } from '../inventory/inventory.gateway';
export declare class ProductService {
    private prisma;
    private inventoryGateway;
    constructor(prisma: PrismaService, inventoryGateway: InventoryGateway);
    create(tenantId: number, createProductDto: CreateProductDto): Promise<{
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
    findAll(tenantId: number, options?: {
        page?: number;
        limit?: number;
        search?: string;
        categoryId?: number;
    }): Promise<{
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
    getSearchIndex(tenantId: number): Promise<({
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
    })[]>;
    findOne(tenantId: number, id: number): Promise<{
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
    update(tenantId: number, id: number, updateProductDto: UpdateProductDto): Promise<{
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
    remove(tenantId: number, id: number): Promise<{
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
}
