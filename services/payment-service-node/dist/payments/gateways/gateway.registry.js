"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "GatewayRegistry", {
    enumerable: true,
    get: function() {
        return GatewayRegistry;
    }
});
const _common = require("@nestjs/common");
const _cashgateway = require("./cash.gateway");
const _stripegateway = require("./stripe.gateway");
const _sslcommerzgateway = require("./sslcommerz.gateway");
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
let GatewayRegistry = class GatewayRegistry {
    getGateway(nameOrMethod) {
        const key = (nameOrMethod || 'CASH').toUpperCase();
        const gateway = this.gateways.get(key);
        if (!gateway) {
            throw new _common.BadRequestException(`Unsupported payment gateway or method: '${nameOrMethod}'`);
        }
        return gateway;
    }
    constructor(cashGateway, stripeGateway, sslCommerzGateway){
        this.cashGateway = cashGateway;
        this.stripeGateway = stripeGateway;
        this.sslCommerzGateway = sslCommerzGateway;
        this.gateways = new Map();
        this.gateways.set('CASH', this.cashGateway);
        this.gateways.set('STRIPE', this.stripeGateway);
        this.gateways.set('CARD', this.stripeGateway); // Default card to Stripe
        this.gateways.set('SSLCOMMERZ', this.sslCommerzGateway);
        this.gateways.set('MFS', this.sslCommerzGateway); // Default MFS (bKash/Nagad) to SSLCOMMERZ
    }
};
GatewayRegistry = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _cashgateway.CashGateway === "undefined" ? Object : _cashgateway.CashGateway,
        typeof _stripegateway.StripeGateway === "undefined" ? Object : _stripegateway.StripeGateway,
        typeof _sslcommerzgateway.SSLCommerzGateway === "undefined" ? Object : _sslcommerzgateway.SSLCommerzGateway
    ])
], GatewayRegistry);

//# sourceMappingURL=gateway.registry.js.map