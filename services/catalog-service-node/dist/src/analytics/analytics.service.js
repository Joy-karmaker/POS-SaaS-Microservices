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
exports.AnalyticsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const inventory_gateway_1 = require("../inventory/inventory.gateway");
let AnalyticsService = class AnalyticsService {
    prisma;
    inventoryGateway;
    constructor(prisma, inventoryGateway) {
        this.prisma = prisma;
        this.inventoryGateway = inventoryGateway;
    }
    async recalculateProductForecast(tenantId, productId, tx) {
        const client = tx || this.prisma;
        const product = await client.product.findFirst({
            where: { id: productId, tenant_id: tenantId },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product #${productId} not found`);
        }
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const saleAggregate = await client.saleItem.aggregate({
            _sum: {
                quantity: true,
            },
            where: {
                product_id: productId,
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
        if (velocity > 0 && product.stock_quantity > 0) {
            const daysRemaining = product.stock_quantity / velocity;
            stockOutDate = new Date();
            stockOutDate.setDate(stockOutDate.getDate() + daysRemaining);
        }
        else if (product.stock_quantity === 0) {
            stockOutDate = new Date();
        }
        const updatedProduct = await client.product.update({
            where: { id: productId },
            data: {
                sales_velocity: velocity,
                stock_out_date: stockOutDate,
            },
            include: { category: true },
        });
        this.inventoryGateway.broadcastProductUpdated(tenantId, updatedProduct);
        return updatedProduct;
    }
    async recalculateAllProductsForecast(tenantId) {
        const products = await this.prisma.product.findMany({
            where: { tenant_id: tenantId },
            select: { id: true },
        });
        const results = [];
        for (const p of products) {
            const updated = await this.recalculateProductForecast(tenantId, p.id);
            results.push(updated);
        }
        return {
            message: `Recalculated forecasting for ${products.length} products.`,
            count: products.length,
        };
    }
    async getAnalyticsSummary(tenantId) {
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const outOfStockCount = await this.prisma.product.count({
            where: {
                tenant_id: tenantId,
                stock_quantity: 0,
            },
        });
        const criticalRiskCount = await this.prisma.product.count({
            where: {
                tenant_id: tenantId,
                stock_quantity: { gt: 0 },
                stock_out_date: {
                    lte: threeDaysFromNow,
                    gte: now,
                },
            },
        });
        const lowRiskCount = await this.prisma.product.count({
            where: {
                tenant_id: tenantId,
                stock_quantity: { gt: 0 },
                stock_out_date: {
                    gt: threeDaysFromNow,
                    lte: sevenDaysFromNow,
                },
            },
        });
        const stableStockCount = await this.prisma.product.count({
            where: {
                tenant_id: tenantId,
                OR: [
                    { stock_out_date: { gt: sevenDaysFromNow } },
                    { stock_out_date: null, stock_quantity: { gt: 0 } },
                ],
            },
        });
        const topVelocityProduct = await this.prisma.product.findFirst({
            where: { tenant_id: tenantId },
            orderBy: { sales_velocity: 'desc' },
            include: { category: true },
        });
        return {
            summary: {
                outOfStock: outOfStockCount,
                criticalRisk: criticalRiskCount,
                lowRisk: lowRiskCount,
                stable: stableStockCount,
            },
            topProduct: topVelocityProduct || null,
        };
    }
    async getForecastList(tenantId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const where = { tenant_id: tenantId };
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: { category: true },
                skip,
                take: limit,
                orderBy: [
                    {
                        stock_out_date: 'asc',
                    },
                    {
                        id: 'desc',
                    },
                ],
            }),
            this.prisma.product.count({ where }),
        ]);
        return {
            data: products,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async seedSimulationSales(tenantId, totalSales = 1000) {
        const products = await this.prisma.product.findMany({
            where: { tenant_id: tenantId },
        });
        if (products.length === 0) {
            throw new common_1.NotFoundException('No products found to seed sales for. Please create products first.');
        }
        const batchSize = 100;
        const now = new Date();
        for (let batch = 0; batch < totalSales; batch += batchSize) {
            const currentBatchSize = Math.min(batchSize, totalSales - batch);
            await this.prisma.$transaction(async (tx) => {
                for (let i = 0; i < currentBatchSize; i++) {
                    const randomDaysAgo = Math.random() * 30;
                    const saleDate = new Date();
                    saleDate.setFloatSeconds(saleDate.getFloatSeconds() - randomDaysAgo * 24 * 60 * 60);
                    const numItems = Math.floor(Math.random() * 4) + 1;
                    const selectedProducts = [...products]
                        .sort(() => 0.5 - Math.random())
                        .slice(0, numItems);
                    let saleTotal = 0;
                    const itemsToCreate = [];
                    for (const prod of selectedProducts) {
                        const qty = Math.floor(Math.random() * 8) + 1;
                        const price = Number(prod.price);
                        saleTotal += price * qty;
                        itemsToCreate.push({
                            product_id: prod.id,
                            quantity: qty,
                            price: price,
                        });
                    }
                    const createdSale = await tx.sale.create({
                        data: {
                            tenant_id: tenantId,
                            total_amount: saleTotal,
                            created_at: saleDate,
                        },
                    });
                    await tx.saleItem.createMany({
                        data: itemsToCreate.map(item => ({
                            ...item,
                            sale_id: createdSale.id,
                        })),
                    });
                }
            });
        }
        await this.recalculateAllProductsForecast(tenantId);
        return {
            success: true,
            message: `Successfully seeded ${totalSales} sales transactions and updated all forecasting models.`,
        };
    }
};
exports.AnalyticsService = AnalyticsService;
exports.AnalyticsService = AnalyticsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        inventory_gateway_1.InventoryGateway])
], AnalyticsService);
Date.prototype.getFloatSeconds = function () {
    return this.getTime() / 1000;
};
Date.prototype.setFloatSeconds = function (seconds) {
    this.setTime(seconds * 1000);
};
//# sourceMappingURL=analytics.service.js.map