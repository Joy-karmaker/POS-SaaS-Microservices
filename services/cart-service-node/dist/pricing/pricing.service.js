"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PricingService", {
    enumerable: true,
    get: function() {
        return PricingService;
    }
});
const _common = require("@nestjs/common");
const _cartservice = require("../cart/cart.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PricingService = class PricingService {
    async calculatePricing(tenantId, payload) {
        let rawItems = payload.items;
        // 1. If cartId is provided, fetch items from CartService
        if (payload.cartId) {
            rawItems = await this.cartService.getCart(tenantId, payload.cartId);
            if (!rawItems || rawItems.length === 0) {
                throw new _common.NotFoundException(`No items found in cart #${payload.cartId}`);
            }
        }
        if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
            throw new _common.BadRequestException('No items provided for pricing calculation');
        }
        // 2. Calculate Subtotal
        let subtotal = 0;
        const itemsSummary = rawItems.map((item)=>{
            const price = parseFloat(item.price);
            const qty = parseInt(item.quantity, 10);
            if (isNaN(price) || isNaN(qty)) {
                throw new _common.BadRequestException(`Invalid item price or quantity`);
            }
            const itemTotal = price * qty;
            subtotal += itemTotal;
            return {
                product_id: item.product_id,
                name: item.name,
                price,
                quantity: qty,
                total: parseFloat(itemTotal.toFixed(2))
            };
        });
        // 3. Calculate Discount
        let discount = 0;
        let appliedPercentage = 0;
        if (payload.discountPercentage) {
            appliedPercentage = Math.max(0, Math.min(100, payload.discountPercentage));
            discount = subtotal * (appliedPercentage / 100);
        } else if (payload.discountCode) {
            const code = payload.discountCode.toUpperCase().trim();
            if (code === 'SAVE10') {
                appliedPercentage = 10;
                discount = subtotal * 0.1;
            } else if (code === 'SAVE20') {
                appliedPercentage = 20;
                discount = subtotal * 0.2;
            } else if (code === 'FLAT50') {
                discount = Math.min(subtotal, 50);
            } else {
                throw new _common.BadRequestException(`Invalid discount code: ${payload.discountCode}`);
            }
        }
        // Rounding subtotal and discount
        subtotal = parseFloat(subtotal.toFixed(2));
        discount = parseFloat(discount.toFixed(2));
        // 4. Calculate Tax (Flat 15% VAT on post-discount amount)
        const taxableAmount = Math.max(0, subtotal - discount);
        const tax = parseFloat((taxableAmount * 0.15).toFixed(2));
        // 5. Calculate Total
        const total = parseFloat((taxableAmount + tax).toFixed(2));
        return {
            subtotal,
            discount,
            appliedPercentage,
            discountCode: payload.discountCode || null,
            tax,
            taxRate: 0.15,
            total,
            items: itemsSummary
        };
    }
    constructor(cartService){
        this.cartService = cartService;
    }
};
PricingService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _cartservice.CartService === "undefined" ? Object : _cartservice.CartService
    ])
], PricingService);

//# sourceMappingURL=pricing.service.js.map