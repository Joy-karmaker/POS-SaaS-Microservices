"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const inventory_gateway_1 = require("../inventory/inventory.gateway");
let ProductService = class ProductService {
    prisma;
    inventoryGateway;
    constructor(prisma, inventoryGateway) {
        this.prisma = prisma;
        this.inventoryGateway = inventoryGateway;
    }
    async create(tenantId, createProductDto) {
        const { image_url, ...rest } = createProductDto;
        const product = await this.prisma.product.create({
            data: {
                ...rest,
                tenant_id: Number(tenantId),
            },
            include: { category: true },
        });
        this.inventoryGateway.broadcastProductCreated(Number(tenantId), product);
        return product;
    }
    async findAll(tenantId, options) {
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        const skip = (page - 1) * limit;
        const where = { tenant_id: Number(tenantId) };
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
    async getSearchIndex(tenantId) {
        return this.prisma.product.findMany({
            where: { tenant_id: Number(tenantId) },
            include: { category: true },
            orderBy: { id: 'desc' }
        });
    }
    async findOne(tenantId, id) {
        const product = await this.prisma.product.findFirst({
            where: { id, tenant_id: Number(tenantId) },
            include: { category: true },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product #${id} not found`);
        }
        return product;
    }
    async update(tenantId, id, updateProductDto) {
        await this.findOne(tenantId, id);
        const { category_id, ...rest } = updateProductDto;
        if ('image_url' in rest)
            delete rest.image_url;
        const updateData = { ...rest };
        if (category_id !== undefined) {
            if (category_id === null) {
                updateData.category = { disconnect: true };
            }
            else {
                updateData.category = { connect: { id: category_id } };
            }
        }
        const updatedProduct = await this.prisma.product.update({
            where: { id },
            data: updateData,
            include: { category: true },
        });
        this.inventoryGateway.broadcastProductUpdated(Number(tenantId), updatedProduct);
        return updatedProduct;
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        const deletedProduct = await this.prisma.product.delete({
            where: { id },
        });
        this.inventoryGateway.broadcastProductDeleted(Number(tenantId), id);
        return deletedProduct;
    }
};
exports.ProductService = ProductService;
exports.ProductService = ProductService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_gateway_1.InventoryGateway])
], ProductService);
//# sourceMappingURL=product.service.js.map