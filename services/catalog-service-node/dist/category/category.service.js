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
const _prismaservice = require("../prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CategoryService = class CategoryService {
    async create(tenantId, createCategoryDto) {
        return this.prisma.category.create({
            data: {
                ...createCategoryDto,
                tenant_id: Number(tenantId)
            }
        });
    }
    async findAll(tenantId, options) {
        const where = {
            tenant_id: Number(tenantId)
        };
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
                    orderBy: {
                        id: 'desc'
                    }
                }),
                this.prisma.category.count({
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
        // Default: return all without pagination (for backwards compatibility if needed)
        return this.prisma.category.findMany({
            where,
            orderBy: {
                id: 'desc'
            }
        });
    }
    async findOne(tenantId, id) {
        const category = await this.prisma.category.findFirst({
            where: {
                id,
                tenant_id: Number(tenantId)
            }
        });
        if (!category) {
            throw new _common.NotFoundException(`Category #${id} not found`);
        }
        return category;
    }
    async update(tenantId, id, updateCategoryDto) {
        // Ensure category exists for this tenant
        await this.findOne(tenantId, id);
        return this.prisma.category.update({
            where: {
                id
            },
            data: updateCategoryDto
        });
    }
    async remove(tenantId, id) {
        // Ensure category exists for this tenant
        await this.findOne(tenantId, id);
        return this.prisma.category.delete({
            where: {
                id
            }
        });
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
CategoryService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], CategoryService);

//# sourceMappingURL=category.service.js.map