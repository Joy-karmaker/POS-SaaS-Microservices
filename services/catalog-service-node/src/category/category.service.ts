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
        tenant_id: tenantId,
      },
    });
  }

  async findAll(tenantId: number) {
    return this.prisma.category.findMany({
      where: { tenant_id: tenantId },
    });
  }

  async findOne(tenantId: number, id: number) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenant_id: tenantId },
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
