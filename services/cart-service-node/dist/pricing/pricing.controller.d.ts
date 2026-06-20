import { PricingService } from './pricing.service';
export declare class PricingController {
    private readonly pricingService;
    constructor(pricingService: PricingService);
    calculatePricing(user: any, body: {
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
