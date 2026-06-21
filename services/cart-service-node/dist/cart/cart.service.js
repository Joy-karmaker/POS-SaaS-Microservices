"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CartService", {
    enumerable: true,
    get: function() {
        return CartService;
    }
});
const _common = require("@nestjs/common");
const _redisservice = require("../redis/redis.service");
const _axios = /*#__PURE__*/ _interop_require_default(require("axios"));
const _crypto = /*#__PURE__*/ _interop_require_wildcard(require("crypto"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _getRequireWildcardCache(nodeInterop) {
    if (typeof WeakMap !== "function") return null;
    var cacheBabelInterop = new WeakMap();
    var cacheNodeInterop = new WeakMap();
    return (_getRequireWildcardCache = function(nodeInterop) {
        return nodeInterop ? cacheNodeInterop : cacheBabelInterop;
    })(nodeInterop);
}
function _interop_require_wildcard(obj, nodeInterop) {
    if (!nodeInterop && obj && obj.__esModule) {
        return obj;
    }
    if (obj === null || typeof obj !== "object" && typeof obj !== "function") {
        return {
            default: obj
        };
    }
    var cache = _getRequireWildcardCache(nodeInterop);
    if (cache && cache.has(obj)) {
        return cache.get(obj);
    }
    var newObj = {
        __proto__: null
    };
    var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor;
    for(var key in obj){
        if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) {
            var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null;
            if (desc && (desc.get || desc.set)) {
                Object.defineProperty(newObj, key, desc);
            } else {
                newObj[key] = obj[key];
            }
        }
    }
    newObj.default = obj;
    if (cache) {
        cache.set(obj, newObj);
    }
    return newObj;
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CartService = class CartService {
    getCartKey(tenantId, cartId) {
        return `tenant:${tenantId}:cart:${cartId}`;
    }
    async createCart() {
        const cartId = _crypto.randomUUID();
        return {
            cartId
        };
    }
    async getCart(tenantId, cartId) {
        const key = this.getCartKey(tenantId, cartId);
        const cartJson = await this.redisService.getClient().get(key);
        return cartJson ? JSON.parse(cartJson) : [];
    }
    async addItem(tenantId, cartId, productId, quantity, authHeader) {
        if (quantity <= 0) {
            throw new _common.BadRequestException('Quantity must be greater than 0');
        }
        // 1. Validate product exists and get details from catalog service
        const product = await this.getProductFromCatalog(productId, authHeader);
        // 2. Check stock level
        if (product.stock_quantity < quantity) {
            throw new _common.BadRequestException(`Insufficient stock. Available: ${product.stock_quantity}`);
        }
        const key = this.getCartKey(tenantId, cartId);
        const cartJson = await this.redisService.getClient().get(key);
        const items = cartJson ? JSON.parse(cartJson) : [];
        const existingIndex = items.findIndex((i)=>i.product_id === productId);
        if (existingIndex > -1) {
            const newQty = items[existingIndex].quantity + quantity;
            if (product.stock_quantity < newQty) {
                throw new _common.BadRequestException(`Insufficient stock. Cannot add more. Available: ${product.stock_quantity}`);
            }
            items[existingIndex].quantity = newQty;
        } else {
            items.push({
                product_id: productId,
                name: product.name,
                price: parseFloat(product.price),
                sku: product.sku,
                barcode: product.barcode,
                quantity
            });
        }
        await this.redisService.getClient().setex(key, 86400, JSON.stringify(items));
        return items;
    }
    async updateItem(tenantId, cartId, productId, quantity, authHeader) {
        if (quantity < 0) {
            throw new _common.BadRequestException('Quantity cannot be negative');
        }
        const key = this.getCartKey(tenantId, cartId);
        const cartJson = await this.redisService.getClient().get(key);
        if (!cartJson) {
            throw new _common.NotFoundException(`Cart #${cartId} not found`);
        }
        const items = JSON.parse(cartJson);
        const existingIndex = items.findIndex((i)=>i.product_id === productId);
        if (existingIndex === -1) {
            throw new _common.NotFoundException(`Product #${productId} not found in cart`);
        }
        if (quantity === 0) {
            items.splice(existingIndex, 1);
        } else {
            // Validate stock level
            const product = await this.getProductFromCatalog(productId, authHeader);
            if (product.stock_quantity < quantity) {
                throw new _common.BadRequestException(`Insufficient stock. Available: ${product.stock_quantity}`);
            }
            items[existingIndex].quantity = quantity;
        }
        await this.redisService.getClient().setex(key, 86400, JSON.stringify(items));
        return items;
    }
    async removeItem(tenantId, cartId, productId) {
        const key = this.getCartKey(tenantId, cartId);
        const cartJson = await this.redisService.getClient().get(key);
        if (!cartJson) {
            throw new _common.NotFoundException(`Cart #${cartId} not found`);
        }
        const items = JSON.parse(cartJson);
        const existingIndex = items.findIndex((i)=>i.product_id === productId);
        if (existingIndex === -1) {
            throw new _common.NotFoundException(`Product #${productId} not found in cart`);
        }
        items.splice(existingIndex, 1);
        await this.redisService.getClient().setex(key, 86400, JSON.stringify(items));
        return items;
    }
    async clearCart(tenantId, cartId) {
        const key = this.getCartKey(tenantId, cartId);
        await this.redisService.getClient().del(key);
    }
    async getProductFromCatalog(productId, authHeader) {
        const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3000';
        try {
            const response = await _axios.default.get(`${catalogUrl}/products/${productId}`, {
                headers: {
                    Authorization: authHeader
                }
            });
            return response.data;
        } catch (e) {
            if (e.response && e.response.status === 404) {
                throw new _common.NotFoundException(`Product #${productId} not found in catalog`);
            }
            throw new _common.BadRequestException(`Failed to validate product against catalog: ${e.message}`);
        }
    }
    constructor(redisService){
        this.redisService = redisService;
    }
};
CartService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _redisservice.RedisService === "undefined" ? Object : _redisservice.RedisService
    ])
], CartService);

//# sourceMappingURL=cart.service.js.map