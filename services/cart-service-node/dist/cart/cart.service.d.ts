import { RedisService } from '../redis/redis.service';
export declare class CartService {
    private redisService;
    constructor(redisService: RedisService);
    private getCartKey;
    createCart(): Promise<{
        cartId: string;
    }>;
    getCart(tenantId: number, cartId: string): Promise<any[]>;
    addItem(tenantId: number, cartId: string, productId: number, quantity: number, authHeader: string): Promise<any[]>;
    updateItem(tenantId: number, cartId: string, productId: number, quantity: number, authHeader: string): Promise<any[]>;
    removeItem(tenantId: number, cartId: string, productId: number): Promise<any[]>;
    clearCart(tenantId: number, cartId: string): Promise<void>;
    private getProductFromCatalog;
}
