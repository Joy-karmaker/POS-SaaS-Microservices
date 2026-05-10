import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoryService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: number, createCategoryDto: CreateCategoryDto): Promise<{
        name: string;
        description: string | null;
        tenant_id: number;
        created_at: Date;
        updated_at: Date;
        id: number;
    }>;
    findAll(tenantId: number): Promise<{
        name: string;
        description: string | null;
        tenant_id: number;
        created_at: Date;
        updated_at: Date;
        id: number;
    }[]>;
    findOne(tenantId: number, id: number): Promise<{
        name: string;
        description: string | null;
        tenant_id: number;
        created_at: Date;
        updated_at: Date;
        id: number;
    }>;
    update(tenantId: number, id: number, updateCategoryDto: UpdateCategoryDto): Promise<{
        name: string;
        description: string | null;
        tenant_id: number;
        created_at: Date;
        updated_at: Date;
        id: number;
    }>;
    remove(tenantId: number, id: number): Promise<{
        name: string;
        description: string | null;
        tenant_id: number;
        created_at: Date;
        updated_at: Date;
        id: number;
    }>;
}
