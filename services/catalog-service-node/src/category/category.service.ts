import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: number, createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        tenant_id: Number(tenantId),
      },
    });
  }

  async findAll(tenantId: number, options?: { page?: number, limit?: number }) {
    const where = { tenant_id: Number(tenantId) };
    
    // If pagination is requested
    if (options && options.page) {
      const page = options.page || 1;
      const limit = options.limit || 5;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        this.prisma.category.findMany({
          where,
          skip,
          take: limit,
          orderBy: { id: 'desc' }
        }),
        this.prisma.category.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    // Default: return all without pagination (for backwards compatibility if needed)
    return this.prisma.category.findMany({
      where,
      orderBy: { id: 'desc' }
    });
  }

  async findOne(tenantId: number, id: number) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenant_id: Number(tenantId) },
    });

    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    return category;
  }

  async update(tenantId: number, id: number, updateCategoryDto: UpdateCategoryDto) {
    // Ensure category exists for this tenant
    await this.findOne(tenantId, id);

    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(tenantId: number, id: number) {
    // Ensure category exists for this tenant
    await this.findOne(tenantId, id);

    return this.prisma.category.delete({
      where: { id },
    });
  }
}
