import { CartService } from './cart.service';
export declare class CartController {
    private readonly cartService;
    constructor(cartService: CartService);
    createCart(): Promise<{
        cartId: string;
    }>;
    getCart(user: any, id: string): Promise<any[]>;
    addItem(user: any, id: string, productId: number, quantity: number, authHeader: string, cookieHeader: string): Promise<any[]>;
    updateItem(user: any, id: string, productId: string, quantity: number, authHeader: string, cookieHeader: string): Promise<any[]>;
    removeItem(user: any, id: string, productId: string): Promise<any[]>;
    clearCart(user: any, id: string): Promise<{
        success: boolean;
    }>;
}
