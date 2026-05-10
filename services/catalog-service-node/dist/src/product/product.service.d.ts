import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: number, createProductDto: CreateProductDto): Promise<{
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
    findAll(tenantId: number): Promise<({
        category: {
            name: string;
            description: string | null;
            tenant_id: number;
            created_at: Date;
            updated_at: Date;
            id: number;
        } | null;
    } & {
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
    })[]>;
    findOne(tenantId: number, id: number): Promise<{
        category: {
            name: string;
            description: string | null;
            tenant_id: number;
            created_at: Date;
            updated_at: Date;
            id: number;
        } | null;
    } & {
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
    update(tenantId: number, id: number, updateProductDto: UpdateProductDto): Promise<{
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
    remove(tenantId: number, id: number): Promise<{
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
}
