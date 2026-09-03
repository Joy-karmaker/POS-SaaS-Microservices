"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PaymentEventsConsumer", {
    enumerable: true,
    get: function() {
        return PaymentEventsConsumer;
    }
});
const _common = require("@nestjs/common");
const _amqplib = /*#__PURE__*/ _interop_require_wildcard(require("amqplib"));
const _ordersservice = require("../orders/orders.service");
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
let PaymentEventsConsumer = class PaymentEventsConsumer {
    async onModuleInit() {
        this.connectWithRetry();
    }
    async connectWithRetry(retries = 10, delayMs = 4000) {
        for(let attempt = 1; attempt <= retries; attempt++){
            try {
                const host = process.env.RABBITMQ_HOST || 'rabbitmq';
                const port = process.env.RABBITMQ_PORT || 5672;
                const user = process.env.RABBITMQ_USER || 'guest';
                const password = process.env.RABBITMQ_PASSWORD || 'guest';
                const vhost = process.env.RABBITMQ_VHOST || '';
                const url = `amqp://${user}:${password}@${host}:${port}/${vhost}`;
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
                await this.channel.bindQueue(this.queue, this.exchange, this.routingPaymentCompleted);
                await this.channel.bindQueue(this.queue, this.exchange, this.routingPaymentFailed);
                await this.channel.consume(this.queue, (msg)=>this.handle(msg), {
                    noAck: false
                });
                this.logger.log(`Consuming payment events on queue ${this.queue}`);
                return;
            } catch (err) {
                this.logger.warn(`RabbitMQ consumer connection attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${delayMs / 1000}s...`);
                if (attempt === retries) {
                    this.logger.error(`RabbitMQ consumer connection failed permanently after ${retries} attempts: ${err.message}`);
                    return;
                }
                await new Promise((resolve)=>setTimeout(resolve, delayMs));
            }
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
        const routingKey = msg.fields?.routingKey || '';
        this.logger.log(`Received event [${routingKey}] for order #${payload.order_id}, tenant #${payload.tenant_id}`);
        try {
            if (routingKey === this.routingPaymentCompleted || payload.event_type === 'payment.completed') {
                await this.ordersService.markPaid(Number(payload.tenant_id), Number(payload.order_id));
            } else if (routingKey === this.routingPaymentFailed || payload.event_type === 'payment.failed') {
                await this.ordersService.markFailed(Number(payload.tenant_id), Number(payload.order_id), payload.reason);
            }
            this.channel.ack(msg);
        } catch (err) {
            this.logger.error(`Failed to handle ${routingKey} for order #${payload?.order_id}: ${err.message}`);
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
    constructor(ordersService){
        this.ordersService = ordersService;
        this.logger = new _common.Logger(PaymentEventsConsumer.name);
        this.exchange = process.env.RABBITMQ_EXCHANGE || 'pos.events';
        this.exchangeType = process.env.RABBITMQ_EXCHANGE_TYPE || 'topic';
        this.dlx = process.env.RABBITMQ_DLX || 'pos.events.dlx';
        this.queue = process.env.RABBITMQ_QUEUE_PAYMENT_COMPLETED_ORDER || 'order.payment.events';
        this.routingPaymentCompleted = process.env.RABBITMQ_ROUTING_PAYMENT_COMPLETED || 'payment.completed';
        this.routingPaymentFailed = process.env.RABBITMQ_ROUTING_PAYMENT_FAILED || 'payment.failed';
    }
};
PaymentEventsConsumer = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _ordersservice.OrdersService === "undefined" ? Object : _ordersservice.OrdersService
    ])
], PaymentEventsConsumer);

//# sourceMappingURL=payment-events.consumer.js.map