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
const inventory_gateway_1 = require("./inventory.gateway");
let InventoryService = class InventoryService {
    prisma;
    inventoryGateway;
    constructor(prisma, inventoryGateway) {
        this.prisma = prisma;
        this.inventoryGateway = inventoryGateway;
    }
    async adjustStock(tenantId, adjustStockDto) {
        const { product_id, quantity_change } = adjustStockDto;
        return this.prisma.$transaction(async (tx) => {
            const products = await tx.$queryRaw `
        SELECT * FROM products 
        WHERE id = ${product_id} AND tenant_id = ${tenantId} 
        FOR UPDATE
      `;
            const product = products[0];
            if (!product) {
                throw new common_1.NotFoundException(`Product #${product_id} not found for this tenant`);
            }
            const newQuantity = product.stock_quantity + quantity_change;
            if (newQuantity < 0) {
                throw new common_1.BadRequestException(`Cannot reduce stock below 0. Current stock: ${product.stock_quantity}`);
            }
            if (quantity_change < 0) {
                const totalAmount = Number(product.price) * Math.abs(quantity_change);
                const sale = await tx.sale.create({
                    data: {
                        tenant_id: tenantId,
                        total_amount: totalAmount,
                    },
                });
                await tx.saleItem.create({
                    data: {
                        sale_id: sale.id,
                        product_id: product_id,
                        quantity: Math.abs(quantity_change),
                        price: product.price,
                    },
                });
            }
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            const saleAggregate = await tx.saleItem.aggregate({
                _sum: {
                    quantity: true,
                },
                where: {
                    product_id: product_id,
                    sale: {
                        tenant_id: tenantId,
                        created_at: {
                            gte: thirtyDaysAgo,
                        },
                    },
                },
            });
            const totalSold = saleAggregate._sum.quantity || 0;
            const now = new Date();
            const createdDate = new Date(product.created_at);
            const diffMs = Math.abs(now.getTime() - createdDate.getTime());
            const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
            const activeDays = Math.max(1, Math.min(30, diffDays));
            const velocity = Number((totalSold / activeDays).toFixed(2));
            let stockOutDate = null;
            if (velocity > 0 && newQuantity > 0) {
                const daysRemaining = newQuantity / velocity;
                stockOutDate = new Date();
                stockOutDate.setDate(stockOutDate.getDate() + daysRemaining);
            }
            else if (newQuantity === 0) {
                stockOutDate = new Date();
            }
            const updatedProduct = await tx.product.update({
                where: { id: product_id },
                data: {
                    stock_quantity: newQuantity,
                    sales_velocity: velocity,
                    stock_out_date: stockOutDate,
                },
                include: { category: true },
            });
            this.inventoryGateway.broadcastStockUpdate(tenantId, product_id, newQuantity);
            this.inventoryGateway.broadcastProductUpdated(tenantId, updatedProduct);
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_gateway_1.InventoryGateway])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map