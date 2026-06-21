"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductService", {
    enumerable: true,
    get: function() {
        return ProductService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma.service");
const _inventorygateway = require("../inventory/inventory.gateway");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ProductService = class ProductService {
    async create(tenantId, createProductDto) {
        const { image_url, ...rest } = createProductDto;
        const product = await this.prisma.product.create({
            data: {
                ...rest,
                tenant_id: Number(tenantId)
            },
            include: {
                category: true
            }
        });
        this.inventoryGateway.broadcastProductCreated(Number(tenantId), product);
        return product;
    }
    async findAll(tenantId, options) {
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        const skip = (page - 1) * limit;
        const where = {
            tenant_id: Number(tenantId)
        };
        if (options?.search) {
            where.name = {
                contains: options.search
            };
        }
        if (options?.categoryId) {
            where.category_id = options.categoryId;
        }
        const [data, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: {
                    category: true
                },
                skip,
                take: limit,
                orderBy: {
                    id: 'desc'
                }
            }),
            this.prisma.product.count({
                where
            })
        ]);
        return {
            data,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    async getSearchIndex(tenantId) {
        return this.prisma.product.findMany({
            where: {
                tenant_id: Number(tenantId)
            },
            include: {
                category: true
            },
            orderBy: {
                id: 'desc'
            }
        });
    }
    async findOne(tenantId, id) {
        const product = await this.prisma.product.findFirst({
            where: {
                id,
                tenant_id: Number(tenantId)
            },
            include: {
                category: true
            }
        });
        if (!product) {
            throw new _common.NotFoundException(`Product #${id} not found`);
        }
        return product;
    }
    async update(tenantId, id, updateProductDto) {
        // Ensure product exists for this tenant
        await this.findOne(tenantId, id);
        const { category_id, ...rest } = updateProductDto;
        // Prisma strips unknown fields at compile time but throws at runtime if passing unexpected keys.
        // Ensure we don't pass frontend-only fields like image_url if they aren't in schema.
        if ('image_url' in rest) delete rest.image_url;
        const updateData = {
            ...rest
        };
        if (category_id !== undefined) {
            if (category_id === null) {
                updateData.category = {
                    disconnect: true
                };
            } else {
                updateData.category = {
                    connect: {
                        id: category_id
                    }
                };
            }
        }
        const updatedProduct = await this.prisma.product.update({
            where: {
                id
            },
            data: updateData,
            include: {
                category: true
            }
        });
        this.inventoryGateway.broadcastProductUpdated(Number(tenantId), updatedProduct);
        return updatedProduct;
    }
    async remove(tenantId, id) {
        // Ensure product exists for this tenant
        await this.findOne(tenantId, id);
        const deletedProduct = await this.prisma.product.delete({
            where: {
                id
            }
        });
        this.inventoryGateway.broadcastProductDeleted(Number(tenantId), id);
        return deletedProduct;
    }
    constructor(prisma, inventoryGateway){
        this.prisma = prisma;
        this.inventoryGateway = inventoryGateway;
    }
};
ProductService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _inventorygateway.InventoryGateway === "undefined" ? Object : _inventorygateway.InventoryGateway
    ])
], ProductService);

//# sourceMappingURL=product.service.js.map