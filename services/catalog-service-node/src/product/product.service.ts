import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: number, createProductDto: CreateProductDto) {
    const { image_url, ...rest } = createProductDto as any;
    
    return this.prisma.product.create({
      data: {
        ...rest,
        tenant_id: Number(tenantId),
      },
      include: { category: true },
    });
  }

  async findAll(tenantId: number, options?: { page?: number, limit?: number, search?: string, categoryId?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = { tenant_id: Number(tenantId) };
    
    if (options?.search) {
      where.name = { contains: options.search };
    }
    
    if (options?.categoryId) {
      where.category_id = options.categoryId;
    }

    const [data, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { id: 'desc' }
      }),
      this.prisma.product.count({ where }),
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

  async findOne(tenantId: number, id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenant_id: Number(tenantId) },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    return product;
  }

  async update(tenantId: number, id: number, updateProductDto: UpdateProductDto) {
    // Ensure product exists for this tenant
    await this.findOne(tenantId, id);

    const { category_id, ...rest } = updateProductDto as any;
    
    // Prisma strips unknown fields at compile time but throws at runtime if passing unexpected keys.
    // Ensure we don't pass frontend-only fields like image_url if they aren't in schema.
    if ('image_url' in rest) delete rest.image_url;

    const updateData: any = { ...rest };
    
    if (category_id !== undefined) {
      if (category_id === null) {
        updateData.category = { disconnect: true };
      } else {
        updateData.category = { connect: { id: category_id } };
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });
  }

  async remove(tenantId: number, id: number) {
    // Ensure product exists for this tenant
    await this.findOne(tenantId, id);

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
