"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReportsService", {
    enumerable: true,
    get: function() {
        return ReportsService;
    }
});
const _common = require("@nestjs/common");
const _prismaservice = require("../prisma/prisma.service");
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
let ReportsService = class ReportsService {
    /**
   * Idempotent handler for sale.completed events (CQRS read-side aggregation).
   * The sale_events table enforces idempotency via a unique event_id.
   */ async handleSaleCompleted(payload) {
        const tenantId = BigInt(payload.tenant_id);
        const totalItems = (payload.items || []).reduce((sum, i)=>sum + i.quantity, 0);
        // Idempotency guard: duplicate event_id is a no-op.
        try {
            await this.prisma.saleEvent.create({
                data: {
                    event_id: payload.event_id,
                    tenant_id: tenantId,
                    order_id: payload.order_id
                }
            });
        } catch (e) {
            // Unique violation => already processed.
            return;
        }
        const occurred = payload.occurred_at ? new Date(payload.occurred_at) : new Date();
        const date = new Date(occurred.getFullYear(), occurred.getMonth(), occurred.getDate());
        const hour = new Date(occurred.getFullYear(), occurred.getMonth(), occurred.getDate(), occurred.getHours());
        await this.prisma.dailySale.upsert({
            where: {
                tenant_id_date: {
                    tenant_id: tenantId,
                    date
                }
            },
            update: {
                total_sales: {
                    increment: payload.total
                },
                total_orders: {
                    increment: 1
                },
                total_items: {
                    increment: totalItems
                }
            },
            create: {
                tenant_id: tenantId,
                date,
                total_sales: payload.total,
                total_orders: 1,
                total_items: totalItems
            }
        });
        await this.prisma.hourlySale.upsert({
            where: {
                tenant_id_hour: {
                    tenant_id: tenantId,
                    hour
                }
            },
            update: {
                total_sales: {
                    increment: payload.total
                },
                total_orders: {
                    increment: 1
                }
            },
            create: {
                tenant_id: tenantId,
                hour,
                total_sales: payload.total,
                total_orders: 1
            }
        });
    }
    async getDailySales(tenantId, date) {
        const where = {
            tenant_id: BigInt(tenantId)
        };
        if (date) {
            where.date = new Date(date);
        }
        return this.prisma.dailySale.findMany({
            where,
            orderBy: {
                date: 'desc'
            }
        });
    }
    async getSummary(tenantId) {
        const rows = await this.prisma.dailySale.findMany({
            where: {
                tenant_id: BigInt(tenantId)
            }
        });
        const totalSales = rows.reduce((s, r)=>s + Number(r.total_sales), 0);
        const totalOrders = rows.reduce((s, r)=>s + r.total_orders, 0);
        return {
            tenant_id: tenantId,
            total_sales: totalSales,
            total_orders: totalOrders,
            days: rows.length
        };
    }
    constructor(prisma){
        this.prisma = prisma;
    }
};
ReportsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _prismaservice.PrismaService === "undefined" ? Object : _prismaservice.PrismaService
    ])
], ReportsService);

//# sourceMappingURL=reports.service.js.map