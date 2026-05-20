import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductController {
    private readonly productService;
    constructor(productService: ProductService);
    create(user: any, createProductDto: CreateProductDto): Promise<{
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
        category_id: number | null;
    }>;
    findAll(user: any, page?: string, limit?: string, search?: string, categoryId?: string): Promise<{
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
            category_id: number | null;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(user: any, id: string): Promise<{
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
        category_id: number | null;
    }>;
    update(user: any, id: string, updateProductDto: UpdateProductDto): Promise<{
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
        category_id: number | null;
    }>;
    remove(user: any, id: string): Promise<{
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
        category_id: number | null;
    }>;
}
