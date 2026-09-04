"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RestockPaymentConsumer", {
    enumerable: true,
    get: function() {
        return RestockPaymentConsumer;
    }
});
const _common = require("@nestjs/common");
const _amqplib = /*#__PURE__*/ _interop_require_wildcard(require("amqplib"));
const _tenantconnectionservice = require("../tenant/tenant-connection.service");
const _restockservice = require("./restock.service");
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) return obj;
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") return {
        default: obj
    };
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) return cache.get(obj);
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) Object.defineProperty(newObj, key, desc);
            else newObj[key] = obj[key];
        }
    }
    newObj.default = obj;
    if (cache) cache.set(obj, newObj);
    return newObj;
}
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
let RestockPaymentConsumer = class RestockPaymentConsumer {
    async onModuleInit() {
        try {
            const url = `amqp://${process.env.RABBITMQ_USER}:${process.env.RABBITMQ_PASSWORD}@${process.env.RABBITMQ_HOST}:${process.env.RABBITMQ_PORT}/${process.env.RABBITMQ_VHOST || ''}`;
            this.connection = await _amqplib.connect(url);
            this.channel = await this.connection.createChannel();
            await this.channel.assertExchange(this.exchange, this.exchangeType, {
                durable: true
            });
            await this.channel.assertExchange(this.dlx, 'topic', {
                durable: true
            });
            await this.channel.assertQueue(this.queue, {
                durable: true,
                arguments: {
                    'x-dead-letter-exchange': this.dlx,
                    'x-dead-letter-routing-key': `${this.queue}.dlq`
                }
            });
            await this.channel.bindQueue(this.queue, this.exchange, this.routingKey);
            await this.channel.consume(this.queue, (msg)=>this.handle(msg), {
                noAck: false
            });
            this.logger.log(`Consuming ${this.routingKey} on queue ${this.queue}`);
        } catch (err) {
            this.logger.error(`Restock payment consumer init failed: ${err.message}`);
        }
    }
    async handle(msg) {
        if (!msg) return;
        let payload;
        try {
            payload = JSON.parse(msg.content.toString());
        } catch  {
            this.channel.nack(msg, false, false);
            return;
        }
        try {
            if (await this.tenant.isProcessed(this.consumer, payload.event_id)) {
                this.channel.ack(msg);
                return;
            }
            const restockOrderId = Number(payload.restock_order_id);
            if (restockOrderId && payload.tenant_id) {
                await this.restockService.markPaid(payload.tenant_id, restockOrderId, {
                    payment_id: payload.payment_id,
                    gateway: payload.gateway,
                    amount: payload.amount
                });
                this.logger.log(`Restock Order #${restockOrderId} marked PAID from event ${payload.event_id}`);
            }
            await this.tenant.markProcessed(this.consumer, payload.event_id);
            this.channel.ack(msg);
        } catch (err) {
            this.logger.error(`Failed to handle restock.paid event ${payload.event_id}: ${err.message}`);
            this.channel.nack(msg, false, false);
        }
    }
    async onModuleDestroy() {
        try {
            await this.channel?.close();
        } catch  {}
        try {
            await this.connection?.close();
        } catch  {}
    }
    constructor(tenant, restockService){
        this.tenant = tenant;
        this.restockService = restockService;
        this.logger = new _common.Logger(RestockPaymentConsumer.name);
        this.exchange = process.env.RABBITMQ_EXCHANGE || 'pos.events';
        this.exchangeType = process.env.RABBITMQ_EXCHANGE_TYPE || 'topic';
        this.dlx = process.env.RABBITMQ_DLX || 'pos.events.dlx';
        this.queue = process.env.RABBITMQ_QUEUE_RESTOCK_PAID_CATALOG || 'catalog.restock.paid';
        this.routingKey = process.env.RABBITMQ_ROUTING_RESTOCK_PAID || 'restock.paid';
        this.consumer = 'catalog.restock.paid';
    }
};
RestockPaymentConsumer = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _tenantconnectionservice.TenantConnectionService === "undefined" ? Object : _tenantconnectionservice.TenantConnectionService,
        typeof _restockservice.RestockService === "undefined" ? Object : _restockservice.RestockService
    ])
], RestockPaymentConsumer);

//# sourceMappingURL=restock-payment.consumer.js.map