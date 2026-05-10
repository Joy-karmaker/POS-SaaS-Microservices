import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
export declare class ProductController {
    private readonly productService;
    constructor(productService: ProductService);
    create(user: any, createProductDto: CreateProductDto): Promise<{
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
    findAll(user: any): Promise<({
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
    findOne(user: any, id: string): Promise<{
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
    update(user: any, id: string, updateProductDto: UpdateProductDto): Promise<{
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
    remove(user: any, id: string): Promise<{
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
