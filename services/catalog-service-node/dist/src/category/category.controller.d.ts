import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    create(user: any, createCategoryDto: CreateCategoryDto): Promise<{
        id: number;
        tenant_id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    findAll(user: any, page?: string, limit?: string): Promise<{
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
    findOne(user: any, id: string): Promise<{
        id: number;
        tenant_id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    update(user: any, id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        id: number;
        tenant_id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
    remove(user: any, id: string): Promise<{
        id: number;
        tenant_id: number;
        name: string;
        description: string | null;
        created_at: Date;
        updated_at: Date;
    }>;
}
