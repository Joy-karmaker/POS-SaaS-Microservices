import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: number, createProductDto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        ...createProductDto,
        tenant_id: tenantId,
      },
    });
  }

  async findAll(tenantId: number) {
    return this.prisma.product.findMany({
      where: { tenant_id: tenantId },
      include: { category: true },
    });
  }

  async findOne(tenantId: number, id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenant_id: tenantId },
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

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto,
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
