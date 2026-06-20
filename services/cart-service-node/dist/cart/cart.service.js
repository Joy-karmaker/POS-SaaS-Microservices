"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const common_1 = require("@nestjs/common");
const redis_service_1 = require("../redis/redis.service");
const axios_1 = __importDefault(require("axios"));
const crypto = __importStar(require("crypto"));
let CartService = class CartService {
    redisService;
    constructor(redisService) {
        this.redisService = redisService;
    }
    getCartKey(tenantId, cartId) {
        return `tenant:${tenantId}:cart:${cartId}`;
    }
    async createCart() {
        const cartId = crypto.randomUUID();
        return { cartId };
    }
    async getCart(tenantId, cartId) {
        const key = this.getCartKey(tenantId, cartId);
        const cartJson = await this.redisService.getClient().get(key);
        return cartJson ? JSON.parse(cartJson) : [];
    }
    async addItem(tenantId, cartId, productId, quantity, authHeader) {
        if (quantity <= 0) {
            throw new common_1.BadRequestException('Quantity must be greater than 0');
        }
        const product = await this.getProductFromCatalog(productId, authHeader);
        if (product.stock_quantity < quantity) {
            throw new common_1.BadRequestException(`Insufficient stock. Available: ${product.stock_quantity}`);
        }
        const key = this.getCartKey(tenantId, cartId);
        const cartJson = await this.redisService.getClient().get(key);
        const items = cartJson ? JSON.parse(cartJson) : [];
        const existingIndex = items.findIndex((i) => i.product_id === productId);
        if (existingIndex > -1) {
            const newQty = items[existingIndex].quantity + quantity;
            if (product.stock_quantity < newQty) {
                throw new common_1.BadRequestException(`Insufficient stock. Cannot add more. Available: ${product.stock_quantity}`);
            }
            items[existingIndex].quantity = newQty;
        }
        else {
            items.push({
                product_id: productId,
                name: product.name,
                price: parseFloat(product.price),
                sku: product.sku,
                barcode: product.barcode,
                quantity,
            });
        }
        await this.redisService.getClient().setex(key, 86400, JSON.stringify(items));
        return items;
    }
    async updateItem(tenantId, cartId, productId, quantity, authHeader) {
        if (quantity < 0) {
            throw new common_1.BadRequestException('Quantity cannot be negative');
        }
        const key = this.getCartKey(tenantId, cartId);
        const cartJson = await this.redisService.getClient().get(key);
        if (!cartJson) {
            throw new common_1.NotFoundException(`Cart #${cartId} not found`);
        }
        const items = JSON.parse(cartJson);
        const existingIndex = items.findIndex((i) => i.product_id === productId);
        if (existingIndex === -1) {
            throw new common_1.NotFoundException(`Product #${productId} not found in cart`);
        }
        if (quantity === 0) {
            items.splice(existingIndex, 1);
        }
        else {
            const product = await this.getProductFromCatalog(productId, authHeader);
            if (product.stock_quantity < quantity) {
                throw new common_1.BadRequestException(`Insufficient stock. Available: ${product.stock_quantity}`);
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
            throw new common_1.NotFoundException(`Cart #${cartId} not found`);
        }
        const items = JSON.parse(cartJson);
        const existingIndex = items.findIndex((i) => i.product_id === productId);
        if (existingIndex === -1) {
            throw new common_1.NotFoundException(`Product #${productId} not found in cart`);
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
            const response = await axios_1.default.get(`${catalogUrl}/products/${productId}`, {
                headers: {
                    Authorization: authHeader,
                },
            });
            return response.data;
        }
        catch (e) {
            if (e.response && e.response.status === 404) {
                throw new common_1.NotFoundException(`Product #${productId} not found in catalog`);
            }
            throw new common_1.BadRequestException(`Failed to validate product against catalog: ${e.message}`);
        }
    }
};
exports.CartService = CartService;
exports.CartService = CartService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService])
], CartService);
//# sourceMappingURL=cart.service.js.map