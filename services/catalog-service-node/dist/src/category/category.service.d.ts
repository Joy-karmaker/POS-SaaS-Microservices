import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoryService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: number, createCategoryDto: CreateCategoryDto): Promise<{
        id: number;
        tenant_id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    findAll(tenantId: number, options?: {
        page?: number;
        limit?: number;
    }): Promise<{
        id: number;
        tenant_id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    }[] | {
        data: {
            id: number;
            tenant_id: number;
            name: string;
            description: string | null;
            created_at: Date;
            updated_at: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(tenantId: number, id: number): Promise<{
        id: number;
        tenant_id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    update(tenantId: number, id: number, updateCategoryDto: UpdateCategoryDto): Promise<{
        id: number;
        tenant_id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    remove(tenantId: number, id: number): Promise<{
        id: number;
        tenant_id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
}
