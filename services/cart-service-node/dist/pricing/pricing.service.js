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
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const cart_service_1 = require("../cart/cart.service");
let PricingService = class PricingService {
    cartService;
    constructor(cartService) {
        this.cartService = cartService;
    }
    async calculatePricing(tenantId, payload) {
        let rawItems = payload.items;
        if (payload.cartId) {
            rawItems = await this.cartService.getCart(tenantId, payload.cartId);
            if (!rawItems || rawItems.length === 0) {
                throw new common_1.NotFoundException(`No items found in cart #${payload.cartId}`);
            }
        }
        if (!rawItems || !Array.isArray(rawItems) || rawItems.length === 0) {
            throw new common_1.BadRequestException('No items provided for pricing calculation');
        }
        let subtotal = 0;
        const itemsSummary = rawItems.map((item) => {
            const price = parseFloat(item.price);
            const qty = parseInt(item.quantity, 10);
            if (isNaN(price) || isNaN(qty)) {
                throw new common_1.BadRequestException(`Invalid item price or quantity`);
            }
            const itemTotal = price * qty;
            subtotal += itemTotal;
            return {
                product_id: item.product_id,
                name: item.name,
                price,
                quantity: qty,
                total: parseFloat(itemTotal.toFixed(2)),
            };
        });
        let discount = 0;
        let appliedPercentage = 0;
        if (payload.discountPercentage) {
            appliedPercentage = Math.max(0, Math.min(100, payload.discountPercentage));
            discount = subtotal * (appliedPercentage / 100);
        }
        else if (payload.discountCode) {
            const code = payload.discountCode.toUpperCase().trim();
            if (code === 'SAVE10') {
                appliedPercentage = 10;
                discount = subtotal * 0.1;
            }
            else if (code === 'SAVE20') {
                appliedPercentage = 20;
                discount = subtotal * 0.2;
            }
            else if (code === 'FLAT50') {
                discount = Math.min(subtotal, 50);
            }
            else {
                throw new common_1.BadRequestException(`Invalid discount code: ${payload.discountCode}`);
            }
        }
        subtotal = parseFloat(subtotal.toFixed(2));
        discount = parseFloat(discount.toFixed(2));
        const taxableAmount = Math.max(0, subtotal - discount);
        const tax = parseFloat((taxableAmount * 0.15).toFixed(2));
        const total = parseFloat((taxableAmount + tax).toFixed(2));
        return {
            subtotal,
            discount,
            appliedPercentage,
            discountCode: payload.discountCode || null,
            tax,
            taxRate: 0.15,
            total,
            items: itemsSummary,
        };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [cart_service_1.CartService])
], PricingService);
//# sourceMappingURL=pricing.service.js.map