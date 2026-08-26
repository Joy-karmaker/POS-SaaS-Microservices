import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private tenantConnectionService: TenantConnectionService) {}

  async create(tenantId: number, createCategoryDto: CreateCategoryDto) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    return client.category.create({
      data: createCategoryDto,
    });
  }

  async findAll(tenantId: number, options?: { page?: number; limit?: number }) {
    const client = await this.tenantConnectionService.getClient(tenantId);

    if (options && options.page) {
      const page = options.page || 1;
      const limit = options.limit || 5;
      const skip = (page - 1) * limit;

      const [data, total] = await Promise.all([
        client.category.findMany({
          skip,
          take: limit,
          orderBy: { id: 'desc' },
        }),
        client.category.count(),
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

    return client.category.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async findOne(tenantId: number, id: number) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    const category = await client.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category #${id} not found`);
    }

    return category;
  }

  async update(tenantId: number, id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.findOne(tenantId, id);
    const client = await this.tenantConnectionService.getClient(tenantId);

    return client.category.update({
      where: { id },
      data: updateCategoryDto,
    });
  }

  async remove(tenantId: number, id: number) {
    await this.findOne(tenantId, id);
    const client = await this.tenantConnectionService.getClient(tenantId);

    return client.category.delete({
      where: { id },
    });
  }
}
