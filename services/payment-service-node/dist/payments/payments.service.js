"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PaymentsService", {
    enumerable: true,
    get: function() {
        return PaymentsService;
    }
});
const _common = require("@nestjs/common");
const _crypto = require("crypto");
const _tenantconnectionservice = require("../tenant/tenant-connection.service");
const _rabbitmqservice = require("../rabbitmq/rabbitmq.service");
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
let PaymentsService = class PaymentsService {
    async pay(tenantId, user, dto) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        // 1. Idempotency: duplicate Idempotency-Key returns the original payment.
        if (dto.idempotency_key) {
            const existing = await client.payment.findUnique({
                where: {
                    idempotency_key: dto.idempotency_key
                }
            });
            if (existing) {
                return {
                    ...existing,
                    idempotent: true
                };
            }
        }
        // 2. Load the order (scoped to the tenant DB).
        const order = await client.order.findUnique({
            where: {
                id: dto.order_id
            },
            include: {
                items: true
            }
        });
        if (!order) {
            throw new _common.NotFoundException(`Order #${dto.order_id} not found`);
        }
        if (order.status === 'PAID') {
            throw new _common.BadRequestException(`Order #${dto.order_id} is already paid`);
        }
        // 3. MVP gateway simulation: cash/card/local MFS are approved immediately.
        //    Real gateway webhooks would update payment status asynchronously.
        const payment = await client.payment.create({
            data: {
                order_id: dto.order_id,
                method: dto.method,
                amount: dto.amount,
                status: 'SUCCESS',
                idempotency_key: dto.idempotency_key ?? null,
                gateway_ref: `sim_${(0, _crypto.randomUUID)()}`
            }
        });
        // 4. Mark order as paid (shared tenant DB).
        await client.order.update({
            where: {
                id: dto.order_id
            },
            data: {
                status: 'PAID'
            }
        });
        // 5. Publish domain events for downstream consumers.
        const eventId = (0, _crypto.randomUUID)();
        const occurredAt = new Date().toISOString();
        const saleCompleted = {
            event_id: eventId,
            event_type: 'sale.completed',
            tenant_id: tenantId,
            store_id: order.store_id ? Number(order.store_id) : null,
            user_id: order.user_id ? Number(order.user_id) : null,
            order_id: order.id,
            total: Number(order.total),
            tax: Number(order.tax),
            discount: Number(order.discount),
            items: order.items.map((i)=>({
                    product_id: i.product_id,
                    quantity: i.quantity,
                    unit_price: Number(i.unit_price)
                })),
            payment_method: dto.method,
            occurred_at: occurredAt
        };
        await this.rabbitMqService.publish(process.env.RABBITMQ_ROUTING_SALE_COMPLETED || 'sale.completed', saleCompleted);
        await this.rabbitMqService.publish(process.env.RABBITMQ_ROUTING_PAYMENT_COMPLETED || 'payment.completed', {
            ...saleCompleted,
            event_type: 'payment.completed'
        });
        return payment;
    }
    async findByTenant(tenantId) {
        const client = await this.tenantConnectionService.getClient(tenantId);
        return client.payment.findMany({
            orderBy: {
                id: 'desc'
            }
        });
    }
    constructor(tenantConnectionService, rabbitMqService){
        this.tenantConnectionService = tenantConnectionService;
        this.rabbitMqService = rabbitMqService;
    }
};
PaymentsService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _tenantconnectionservice.TenantConnectionService === "undefined" ? Object : _tenantconnectionservice.TenantConnectionService,
        typeof _rabbitmqservice.RabbitMqService === "undefined" ? Object : _rabbitmqservice.RabbitMqService
    ])
], PaymentsService);

//# sourceMappingURL=payments.service.js.map