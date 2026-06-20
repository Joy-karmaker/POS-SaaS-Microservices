import { CartService } from '../cart/cart.service';
export declare class PricingService {
    private cartService;
    constructor(cartService: CartService);
    calculatePricing(tenantId: number, payload: {
        cartId?: string;
        items?: any[];
        discountCode?: string;
        discountPercentage?: number;
    }): Promise<{
        subtotal: number;
        discount: number;
        appliedPercentage: number;
        discountCode: string | null;
        tax: number;
        taxRate: number;
        total: number;
        items: {
            product_id: any;
            name: any;
            price: number;
            quantity: number;
            total: number;
        }[];
    }>;
}
