"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CartController", {
    enumerable: true,
    get: function() {
        return CartController;
    }
});
const _common = require("@nestjs/common");
const _cartservice = require("./cart.service");
const _jwtauthguard = require("../auth/jwt-auth.guard");
const _currentuserdecorator = require("../auth/current-user.decorator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
function extractAuthHeader(authHeader, cookieHeader) {
    if (authHeader) return authHeader;
    if (cookieHeader) {
        const match = cookieHeader.match(/pos_access_token=([^;]+)/);
        if (match) return `Bearer ${decodeURIComponent(match[1])}`;
    }
    return '';
}
let CartController = class CartController {
    createCart() {
        return this.cartService.createCart();
    }
    getCart(user, id) {
        return this.cartService.getCart(user.tenant_id, id);
    }
    addItem(user, id, productId, quantity, authHeader, cookieHeader) {
        const tokenHeader = extractAuthHeader(authHeader, cookieHeader);
        return this.cartService.addItem(user.tenant_id, id, +productId, +quantity, tokenHeader);
    }
    updateItem(user, id, productId, quantity, authHeader, cookieHeader) {
        const tokenHeader = extractAuthHeader(authHeader, cookieHeader);
        return this.cartService.updateItem(user.tenant_id, id, +productId, +quantity, tokenHeader);
    }
    removeItem(user, id, productId) {
        return this.cartService.removeItem(user.tenant_id, id, +productId);
    }
    async clearCart(user, id) {
        await this.cartService.clearCart(user.tenant_id, id);
        return {
            success: true
        };
    }
    constructor(cartService){
        this.cartService = cartService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", void 0)
], CartController.prototype, "createCart", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], CartController.prototype, "getCart", null);
_ts_decorate([
    (0, _common.Post)(':id/items'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)('product_id')),
    _ts_param(3, (0, _common.Body)('quantity')),
    _ts_param(4, (0, _common.Headers)('authorization')),
    _ts_param(5, (0, _common.Headers)('cookie')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Number,
        Number,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], CartController.prototype, "addItem", null);
_ts_decorate([
    (0, _common.Patch)(':id/items/:productId'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Param)('productId')),
    _ts_param(3, (0, _common.Body)('quantity')),
    _ts_param(4, (0, _common.Headers)('authorization')),
    _ts_param(5, (0, _common.Headers)('cookie')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String,
        Number,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], CartController.prototype, "updateItem", null);
_ts_decorate([
    (0, _common.Delete)(':id/items/:productId'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Param)('productId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], CartController.prototype, "removeItem", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], CartController.prototype, "clearCart", null);
CartController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('cart'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _cartservice.CartService === "undefined" ? Object : _cartservice.CartService
    ])
], CartController);

//# sourceMappingURL=cart.controller.js.map