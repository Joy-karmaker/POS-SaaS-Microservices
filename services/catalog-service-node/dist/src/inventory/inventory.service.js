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
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let InventoryService = class InventoryService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async adjustStock(tenantId, adjustStockDto) {
        const { product_id, quantity_change } = adjustStockDto;
        return this.prisma.$transaction(async (tx) => {
            const product = await tx.product.findFirst({
                where: { id: product_id, tenant_id: tenantId },
            });
            if (!product) {
                throw new common_1.NotFoundException(`Product #${product_id} not found for this tenant`);
            }
            const newQuantity = product.stock_quantity + quantity_change;
            if (newQuantity < 0) {
                throw new common_1.BadRequestException(`Cannot reduce stock below 0. Current stock: ${product.stock_quantity}`);
            }
            const updatedProduct = await tx.product.update({
                where: { id: product_id },
                data: { stock_quantity: newQuantity },
            });
            return updatedProduct;
        });
    }
    async getStock(tenantId, productId) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, tenant_id: tenantId },
            select: { id: true, name: true, stock_quantity: true },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product #${productId} not found`);
        }
        return product;
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map