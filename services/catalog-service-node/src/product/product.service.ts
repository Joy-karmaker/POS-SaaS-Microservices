import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantConnectionService } from '../tenant/tenant-connection.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InventoryGateway } from '../inventory/inventory.gateway';

@Injectable()
export class ProductService {
  constructor(
    private tenantConnectionService: TenantConnectionService,
    private inventoryGateway: InventoryGateway,
  ) {}

  async create(tenantId: number, createProductDto: CreateProductDto) {
    const { image_url, ...rest } = createProductDto as any;
    const client = await this.tenantConnectionService.getClient(tenantId);

    const product = await client.product.create({
      data: rest,
      include: { category: true },
    });

    this.inventoryGateway.broadcastProductCreated(Number(tenantId), product);
    return product;
  }

  async findAll(tenantId: number, options?: { page?: number; limit?: number; search?: string; categoryId?: number }) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options?.search) {
      where.name = { contains: options.search };
    }

    if (options?.categoryId) {
      where.category_id = options.categoryId;
    }

    const [data, total] = await Promise.all([
      client.product.findMany({
        where,
        include: { category: true },
        skip,
        take: limit,
        orderBy: { id: 'desc' },
      }),
      client.product.count({ where }),
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

  async getSearchIndex(tenantId: number) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    return client.product.findMany({
      include: { category: true },
      orderBy: { id: 'desc' },
    });
  }

  async findOne(tenantId: number, id: number) {
    const client = await this.tenantConnectionService.getClient(tenantId);
    const product = await client.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Product #${id} not found`);
    }

    return product;
  }

  async update(tenantId: number, id: number, updateProductDto: UpdateProductDto) {
    await this.findOne(tenantId, id);
    const client = await this.tenantConnectionService.getClient(tenantId);

    const { category_id, ...rest } = updateProductDto as any;

    if ('image_url' in rest) delete rest.image_url;

    const updateData: any = { ...rest };

    if (category_id !== undefined) {
      if (category_id === null) {
        updateData.category = { disconnect: true };
      } else {
        updateData.category = { connect: { id: category_id } };
      }
    }

    const updatedProduct = await client.product.update({
      where: { id },
      data: updateData,
      include: { category: true },
    });

    this.inventoryGateway.broadcastProductUpdated(Number(tenantId), updatedProduct);
    return updatedProduct;
  }

  async remove(tenantId: number, id: number) {
    await this.findOne(tenantId, id);
    const client = await this.tenantConnectionService.getClient(tenantId);

    const deletedProduct = await client.product.delete({
      where: { id },
    });

    this.inventoryGateway.broadcastProductDeleted(Number(tenantId), id);
    return deletedProduct;
  }
}
