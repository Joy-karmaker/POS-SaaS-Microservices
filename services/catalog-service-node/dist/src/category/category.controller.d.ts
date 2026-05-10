import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
export declare class CategoryController {
    private readonly categoryService;
    constructor(categoryService: CategoryService);
    create(user: any, createCategoryDto: CreateCategoryDto): Promise<{
        name: string;
        description: string | null;
        tenant_id: number;
        created_at: Date;
        updated_at: Date;
        id: number;
    }>;
    findAll(user: any): Promise<{
        name: string;
        description: string | null;
        tenant_id: number;
        created_at: Date;
        updated_at: Date;
        id: number;
    }[]>;
    findOne(user: any, id: string): Promise<{
        name: string;
        description: string | null;
        tenant_id: number;
        created_at: Date;
        updated_at: Date;
        id: number;
    }>;
    update(user: any, id: string, updateCategoryDto: UpdateCategoryDto): Promise<{
        name: string;
        description: string | null;
        tenant_id: number;
        created_at: Date;
        updated_at: Date;
        id: number;
    }>;
    remove(user: any, id: string): Promise<{
        name: string;
        description: string | null;
        tenant_id: number;
        created_at: Date;
        updated_at: Date;
        id: number;
    }>;
}
