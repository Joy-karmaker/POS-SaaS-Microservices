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
const _tenantconnectionservice = require("../tenant/tenant-connection.service");
const _inventorygateway = require("../inventory/inventory.gateway");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") {
        r = Reflect.decorate(decorators, target, key, desc);
    } else {
        for(var i = decorators.length - 1; i >= 0; i--){
            if (d = decorators[i]) {
                r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
            }
        }
    }
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
let ProductService = class ProductService {
    async create(tenantId, createProductDto) {
        const { image_url, ...rest } = createProductDto;
        const client = await this.tenantConnectionService.getClient(tenantId);
        const product = await client.product.create({
            data: rest,
            include: {
                category: true
            }
        });
        this.inventoryGateway.broadcastProductCreated(Number(tenantId), product);
        return product;
    }
    async findAll(tenantId, options) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        const page = options?.page || 1;
        const limit = options?.limit || 10;
        const skip = (page - 1) * limit;
        const where = {};
        if (options?.search) {
            where.name = {
                contains: options.search
            };
        }
        if (options?.categoryId) {
            where.category_id = options.categoryId;
        }
        const [data, total] = await Promise.all([
            client.product.findMany({
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
            client.product.count({
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
        const client = await this.tenantConnectionService.getClient(tenantId);
        return client.product.findMany({
            include: {
                category: true
            },
            orderBy: {
                id: 'desc'
            }
        });
    }
    async findOne(tenantId, id) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        const product = await client.product.findUnique({
            where: {
                id
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
        await this.findOne(tenantId, id);
        const client = await this.tenantConnectionService.getClient(tenantId);
        const { category_id, ...rest } = updateProductDto;
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
        const updatedProduct = await client.product.update({
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
        await this.findOne(tenantId, id);
        const client = await this.tenantConnectionService.getClient(tenantId);
        const deletedProduct = await client.product.delete({
            where: {
                id
            }
        });
        this.inventoryGateway.broadcastProductDeleted(Number(tenantId), id);
        return deletedProduct;
    }
    constructor(tenantConnectionService, inventoryGateway){
        this.tenantConnectionService = tenantConnectionService;
        this.inventoryGateway = inventoryGateway;
    }
};
ProductService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _tenantconnectionservice.TenantConnectionService === "undefined" ? Object : _tenantconnectionservice.TenantConnectionService,
        typeof _inventorygateway.InventoryGateway === "undefined" ? Object : _inventorygateway.InventoryGateway
    ])
], ProductService);

//# sourceMappingURL=product.service.js.map