"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AnalyticsService", {
    enumerable: true,
    get: function() {
        return AnalyticsService;
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
let AnalyticsService = class AnalyticsService {
    /**
   * Recalculates and updates sales velocity and stock-out date for a specific product.
   */ async recalculateProductForecast(tenantId, productId, tx) {
        const client = tx || this.prisma;
        // 1. Fetch the product
        const product = await client.product.findFirst({
            where: {
                id: productId,
                tenant_id: tenantId
            }
        });
        if (!product) {
            throw new _common.NotFoundException(`Product #${productId} not found`);
        }
        // 2. Aggregate total quantity sold in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const saleAggregate = await client.saleItem.aggregate({
            _sum: {
                quantity: true
            },
            where: {
                product_id: productId,
                sale: {
                    tenant_id: tenantId,
                    created_at: {
                        gte: thirtyDaysAgo
                    }
                }
            }
        });
        const totalSold = saleAggregate._sum.quantity || 0;
        // 3. Determine active days for calculation (max 30, min 1)
        const now = new Date();
        const createdDate = new Date(product.created_at);
        const diffMs = Math.abs(now.getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const activeDays = Math.max(1, Math.min(30, diffDays));
        // 4. Calculate velocity (units sold per day)
        const velocity = Number((totalSold / activeDays).toFixed(2));
        // 5. Predict Stock-out Date
        let stockOutDate = null;
        if (velocity > 0 && product.stock_quantity > 0) {
            const daysRemaining = product.stock_quantity / velocity;
            stockOutDate = new Date();
            stockOutDate.setDate(stockOutDate.getDate() + daysRemaining);
        } else if (product.stock_quantity === 0) {
            stockOutDate = new Date(); // Stocks out today/immediately
        }
        // 6. Save the computed forecasting metrics in the product table (caching)
        const updatedProduct = await client.product.update({
            where: {
                id: productId
            },
            data: {
                sales_velocity: velocity,
                stock_out_date: stockOutDate
            },
            include: {
                category: true
            }
        });
        // 7. Broadcast updated forecast through WebSockets for real-time dashboard sync
        this.inventoryGateway.broadcastProductUpdated(tenantId, updatedProduct);
        return updatedProduct;
    }
    /**
   * Recalculates metrics for ALL products of a tenant in batch.
   */ async recalculateAllProductsForecast(tenantId) {
        const products = await this.prisma.product.findMany({
            where: {
                tenant_id: tenantId
            },
            select: {
                id: true
            }
        });
        const results = [];
        for (const p of products){
            const updated = await this.recalculateProductForecast(tenantId, p.id);
            results.push(updated);
        }
        return {
            message: `Recalculated forecasting for ${products.length} products.`,
            count: products.length
        };
    }
    /**
   * Returns high-level KPIs for the Inventory Analytics Dashboard.
   */ async getAnalyticsSummary(tenantId) {
        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        // 1. Out of stock count
        const outOfStockCount = await this.prisma.product.count({
            where: {
                tenant_id: tenantId,
                stock_quantity: 0
            }
        });
        // 2. Critical stock-out risk (<3 days)
        const criticalRiskCount = await this.prisma.product.count({
            where: {
                tenant_id: tenantId,
                stock_quantity: {
                    gt: 0
                },
                stock_out_date: {
                    lte: threeDaysFromNow,
                    gte: now
                }
            }
        });
        // 3. Low stock-out risk (3-7 days)
        const lowRiskCount = await this.prisma.product.count({
            where: {
                tenant_id: tenantId,
                stock_quantity: {
                    gt: 0
                },
                stock_out_date: {
                    gt: threeDaysFromNow,
                    lte: sevenDaysFromNow
                }
            }
        });
        // 4. Stable stock count
        const stableStockCount = await this.prisma.product.count({
            where: {
                tenant_id: tenantId,
                OR: [
                    {
                        stock_out_date: {
                            gt: sevenDaysFromNow
                        }
                    },
                    {
                        stock_out_date: null,
                        stock_quantity: {
                            gt: 0
                        }
                    }
                ]
            }
        });
        // 5. Find top sales velocity product
        const topVelocityProduct = await this.prisma.product.findFirst({
            where: {
                tenant_id: tenantId
            },
            orderBy: {
                sales_velocity: 'desc'
            },
            include: {
                category: true
            }
        });
        return {
            summary: {
                outOfStock: outOfStockCount,
                criticalRisk: criticalRiskCount,
                lowRisk: lowRiskCount,
                stable: stableStockCount
            },
            topProduct: topVelocityProduct || null
        };
    }
    /**
   * Returns list of products sorted by stock-out priority (highest risk first).
   */ async getForecastList(tenantId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const where = {
            tenant_id: tenantId
        };
        // Query sorted by stock_out_date ascending, placing nulls (never stocks out) at the end
        // Prisma does not natively support NULLS LAST easily in standard findMany, so we will use a raw order query or sort logic.
        // However, we can order by stock_out_date ascending and handle the listing elegantly.
        const [products, total] = await Promise.all([
            this.prisma.product.findMany({
                where,
                include: {
                    category: true
                },
                skip,
                take: limit,
                orderBy: [
                    {
                        stock_out_date: 'asc'
                    },
                    {
                        id: 'desc'
                    }
                ]
            }),
            this.prisma.product.count({
                where
            })
        ]);
        // To ensure "Never" products (null stock_out_date) display at the bottom but are still in pagination, 
        // we fetch and let the frontend handle the presentation.
        return {
            data: products,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }
    /**
   * Seeds historical sales data over the past 30 days to simulate standard load and test performance.
   */ async seedSimulationSales(tenantId, totalSales = 1000) {
        const products = await this.prisma.product.findMany({
            where: {
                tenant_id: tenantId
            }
        });
        if (products.length === 0) {
            throw new _common.NotFoundException('No products found to seed sales for. Please create products first.');
        }
        // Seed sales in batches to prevent transaction locks or memory overhead
        const batchSize = 100;
        const now = new Date();
        for(let batch = 0; batch < totalSales; batch += batchSize){
            const currentBatchSize = Math.min(batchSize, totalSales - batch);
            await this.prisma.$transaction(async (tx)=>{
                for(let i = 0; i < currentBatchSize; i++){
                    // 1. Generate random date within the last 30 days
                    const randomDaysAgo = Math.random() * 30;
                    const saleDate = new Date();
                    saleDate.setFloatSeconds(saleDate.getFloatSeconds() - randomDaysAgo * 24 * 60 * 60);
                    // 2. Select 1 to 5 random products for this sale
                    const numItems = Math.floor(Math.random() * 4) + 1;
                    const selectedProducts = [
                        ...products
                    ].sort(()=>0.5 - Math.random()).slice(0, numItems);
                    let saleTotal = 0;
                    const itemsToCreate = [];
                    for (const prod of selectedProducts){
                        // Random quantity between 1 and 8 units
                        const qty = Math.floor(Math.random() * 8) + 1;
                        const price = Number(prod.price);
                        saleTotal += price * qty;
                        itemsToCreate.push({
                            product_id: prod.id,
                            quantity: qty,
                            price: price
                        });
                    }
                    // 3. Insert Sale
                    const createdSale = await tx.sale.create({
                        data: {
                            tenant_id: tenantId,
                            total_amount: saleTotal,
                            created_at: saleDate
                        }
                    });
                    // 4. Insert SaleItems
                    await tx.saleItem.createMany({
                        data: itemsToCreate.map((item)=>({
                                ...item,
                                sale_id: createdSale.id
                            }))
                    });
                }
            });
        }
        // Recalculate forecasting metrics for all products based on the new seeded sales history
        await this.recalculateAllProductsForecast(tenantId);
        return {
            success: true,
            message: `Successfully seeded ${totalSales} sales transactions and updated all forecasting models.`
        };
    }
    constructor(prisma, inventoryGateway){
        this.prisma = prisma;
        this.inventoryGateway = inventoryGateway;
    }
};
AnalyticsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService,
        typeof _inventorygateway.InventoryGateway === "undefined" ? Object : _inventorygateway.InventoryGateway
    ])
], AnalyticsService);
Date.prototype.getFloatSeconds = function() {
    return this.getTime() / 1000;
};
Date.prototype.setFloatSeconds = function(seconds) {
    this.setTime(seconds * 1000);
};

//# sourceMappingURL=analytics.service.js.map