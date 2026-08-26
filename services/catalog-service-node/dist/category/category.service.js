"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CategoryService", {
    enumerable: true,
    get: function() {
        return CategoryService;
    }
});
const _common = require("@nestjs/common");
const _tenantconnectionservice = require("../tenant/tenant-connection.service");
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
let CategoryService = class CategoryService {
    async create(tenantId, createCategoryDto) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        return client.category.create({
            data: createCategoryDto
        });
    }
    async findAll(tenantId, options) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        if (options && options.page) {
            const page = options.page || 1;
            const limit = options.limit || 5;
            const skip = (page - 1) * limit;
            const [data, total] = await Promise.all([
                client.category.findMany({
                    skip,
                    take: limit,
                    orderBy: {
                        id: 'desc'
                    }
                }),
                client.category.count()
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
        return client.category.findMany({
            orderBy: {
                id: 'desc'
            }
        });
    }
    async findOne(tenantId, id) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        const category = await client.category.findUnique({
            where: {
                id
            }
        });
        if (!category) {
            throw new _common.NotFoundException(`Category #${id} not found`);
        }
        return category;
    }
    async update(tenantId, id, updateCategoryDto) {
        await this.findOne(tenantId, id);
        const client = await this.tenantConnectionService.getClient(tenantId);
        return client.category.update({
            where: {
                id
            },
            data: updateCategoryDto
        });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        const client = await this.tenantConnectionService.getClient(tenantId);
        return client.category.delete({
            where: {
                id
            }
        });
    }
    constructor(tenantConnectionService){
        this.tenantConnectionService = tenantConnectionService;
    }
};
CategoryService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _tenantconnectionservice.TenantConnectionService === "undefined" ? Object : _tenantconnectionservice.TenantConnectionService
    ])
], CategoryService);

//# sourceMappingURL=category.service.js.map