"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OutboxService", {
    enumerable: true,
    get: function() {
        return OutboxService;
    }
});
const _common = require("@nestjs/common");
const _rabbitmqservice = require("../../rabbitmq/rabbitmq.service");
const _tenantconnectionservice = require("../../tenant/tenant-connection.service");
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
let OutboxService = class OutboxService {
    onModuleInit() {
        // Run outbox publisher check every 5 seconds
        this.timer = setInterval(()=>{
            this.flushAllOutboxes().catch((err)=>{
                this.logger.error(`Outbox worker flush error: ${err.message}`);
            });
        }, 5000);
    }
    registerTenant(tenantId) {
        this.knownTenants.add(Number(tenantId));
    }
    /**
   * Records an outbox event into the tenant DB within an active transaction or client connection.
   */ async recordEvent(tenantId, event) {
        this.registerTenant(tenantId);
        const client = await this.tenantConnectionService.getClient(tenantId);
        await client.outboxEvent.create({
            data: {
                aggregate_type: event.aggregateType,
                aggregate_id: String(event.aggregateId),
                event_type: event.eventType,
                payload: JSON.stringify(event.payload),
                status: 'PENDING'
            }
        });
        // Proactively flush immediately for instant low latency
        setImmediate(()=>{
            this.flushTenantOutbox(tenantId).catch(()=>{});
        });
    }
    /**
   * Flushes pending events for a specific tenant to RabbitMQ.
   */ async flushTenantOutbox(tenantId) {
        try {
            const client = await this.tenantConnectionService.getClient(tenantId);
            const pendingEvents = await client.outboxEvent.findMany({
                where: {
                    status: 'PENDING'
                },
                take: 50,
                orderBy: {
                    created_at: 'asc'
                }
            });
            if (pendingEvents.length === 0) return 0;
            let publishedCount = 0;
            for (const ev of pendingEvents){
                try {
                    const payload = JSON.parse(ev.payload);
                    const routingKey = ev.event_type;
                    const published = await this.rabbitMqService.publish(routingKey, payload);
                    if (published) {
                        await client.outboxEvent.update({
                            where: {
                                id: ev.id
                            },
                            data: {
                                status: 'PUBLISHED',
                                published_at: new Date()
                            }
                        });
                        publishedCount++;
                    } else {
                        this.logger.warn(`RabbitMQ publish returned false for event #${ev.id} (${ev.event_type})`);
                    }
                } catch (err) {
                    this.logger.error(`Failed to publish outbox event #${ev.id}: ${err.message}`);
                    await client.outboxEvent.update({
                        where: {
                            id: ev.id
                        },
                        data: {
                            retry_count: {
                                increment: 1
                            },
                            error_message: err.message
                        }
                    });
                }
            }
            if (publishedCount > 0) {
                this.logger.log(`Flushed ${publishedCount} outbox events for Tenant #${tenantId}`);
            }
            return publishedCount;
        } catch (err) {
            this.logger.warn(`Error flushing outbox for Tenant #${tenantId}: ${err.message}`);
            return 0;
        }
    }
    async flushAllOutboxes() {
        for (const tenantId of this.knownTenants){
            await this.flushTenantOutbox(tenantId);
        }
    }
    onModuleDestroy() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }
    constructor(rabbitMqService, tenantConnectionService){
        this.rabbitMqService = rabbitMqService;
        this.tenantConnectionService = tenantConnectionService;
        this.logger = new _common.Logger(OutboxService.name);
        this.timer = null;
        this.knownTenants = new Set();
    }
};
OutboxService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _rabbitmqservice.RabbitMqService === "undefined" ? Object : _rabbitmqservice.RabbitMqService,
        typeof _tenantconnectionservice.TenantConnectionService === "undefined" ? Object : _tenantconnectionservice.TenantConnectionService
    ])
], OutboxService);

//# sourceMappingURL=outbox.service.js.map