"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrdersService", {
    enumerable: true,
    get: function() {
        return OrdersService;
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
let OrdersService = class OrdersService {
    async create(tenantId, user, dto) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        const order = await client.order.create({
            data: {
                store_id: dto.store_id ? BigInt(dto.store_id) : user.store_id ? BigInt(user.store_id) : null,
                user_id: user.id ? BigInt(user.id) : null,
                shift_id: dto.shift_id ? BigInt(dto.shift_id) : null,
                status: 'PENDING',
                subtotal: dto.subtotal,
                tax: dto.tax ?? 0,
                discount: dto.discount ?? 0,
                total: dto.total,
                items: {
                    create: dto.items.map((i)=>({
                            product_id: i.product_id,
                            product_name: i.product_name,
                            quantity: i.quantity,
                            unit_price: i.unit_price,
                            total_price: i.unit_price * i.quantity
                        }))
                }
            },
            include: {
                items: true
            }
        });
        return order;
    }
    async findOne(tenantId, id) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        const order = await client.order.findUnique({
            where: {
                id
            },
            include: {
                items: true
            }
        });
        if (!order) {
            throw new _common.NotFoundException(`Order #${id} not found`);
        }
        return order;
    }
    async findByTenant(tenantId, filters) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        const where = {};
        if (filters?.status && filters.status !== 'ALL') {
            where.status = filters.status;
        }
        if (filters?.storeId) {
            where.store_id = BigInt(filters.storeId);
        }
        return client.order.findMany({
            where,
            include: {
                items: true
            },
            orderBy: {
                id: 'desc'
            }
        });
    }
    async markPaid(tenantId, id) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        const existing = await client.order.findUnique({
            where: {
                id
            }
        });
        if (!existing) {
            this.logger.warn(`Cannot mark order #${id} as PAID: order not found for tenant #${tenantId}`);
            return null;
        }
        if (existing.status === 'PAID') {
            this.logger.log(`Order #${id} is already marked as PAID`);
            return existing;
        }
        const updated = await client.order.update({
            where: {
                id
            },
            data: {
                status: 'PAID'
            },
            include: {
                items: true
            }
        });
        this.logger.log(`Order #${id} marked as PAID for tenant #${tenantId}`);
        return updated;
    }
    async markFailed(tenantId, id, reason) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        const existing = await client.order.findUnique({
            where: {
                id
            }
        });
        if (!existing) {
            this.logger.warn(`Cannot mark order #${id} as PAYMENT_FAILED: order not found for tenant #${tenantId}`);
            return null;
        }
        if (existing.status === 'PAID') {
            this.logger.warn(`Order #${id} is already PAID, ignoring payment failed event`);
            return existing;
        }
        const updated = await client.order.update({
            where: {
                id
            },
            data: {
                status: 'PAYMENT_FAILED'
            },
            include: {
                items: true
            }
        });
        this.logger.log(`Order #${id} marked as PAYMENT_FAILED for tenant #${tenantId}. Reason: ${reason || 'Declined'}`);
        return updated;
    }
    async cancelOrder(tenantId, id) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        const existing = await client.order.findUnique({
            where: {
                id
            }
        });
        if (!existing) {
            throw new _common.NotFoundException(`Order #${id} not found`);
        }
        if (existing.status === 'PAID') {
            throw new Error(`Cannot cancel Order #${id} because it is already PAID`);
        }
        const updated = await client.order.update({
            where: {
                id
            },
            data: {
                status: 'CANCELLED'
            },
            include: {
                items: true
            }
        });
        this.logger.log(`Order #${id} marked as CANCELLED for tenant #${tenantId}`);
        return updated;
    }
    constructor(tenantConnectionService){
        this.tenantConnectionService = tenantConnectionService;
        this.logger = new _common.Logger(OrdersService.name);
    }
};
OrdersService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _tenantconnectionservice.TenantConnectionService === "undefined" ? Object : _tenantconnectionservice.TenantConnectionService
    ])
], OrdersService);

//# sourceMappingURL=orders.service.js.map