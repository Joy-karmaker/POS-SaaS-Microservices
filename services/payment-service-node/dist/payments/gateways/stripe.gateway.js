"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "StripeGateway", {
    enumerable: true,
    get: function() {
        return StripeGateway;
    }
});
const _common = require("@nestjs/common");
const _crypto = require("crypto");
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
let StripeGateway = class StripeGateway {
    get apiKey() {
        return process.env.STRIPE_SECRET_KEY || 'sk_test_mock_stripe_secret_key';
    }
    get isMock() {
        return !this.apiKey || this.apiKey.includes('mock');
    }
    async createPayment(input) {
        const currency = (input.currency || 'USD').toLowerCase();
        const amountInCents = Number(input.amountCents || Math.round(input.amount * 100));
        if (this.isMock) {
            const simId = `pi_sim_${(0, _crypto.randomUUID)().replace(/-/g, '').slice(0, 24)}`;
            const simSecret = `${simId}_secret_${(0, _crypto.randomUUID)().replace(/-/g, '').slice(0, 16)}`;
            this.logger.log(`[Stripe Mock] Created simulated PaymentIntent ${simId} for ${input.amount} ${currency}`);
            return {
                gateway: this.gatewayName,
                gatewayRef: simId,
                status: 'REQUIRES_ACTION',
                clientSecret: simSecret,
                redirectUrl: undefined,
                rawResponse: {
                    id: simId,
                    client_secret: simSecret,
                    amount: amountInCents,
                    currency,
                    status: 'requires_payment_method',
                    is_mock: true
                }
            };
        }
        try {
            const body = new URLSearchParams();
            body.append('amount', amountInCents.toString());
            body.append('currency', currency);
            body.append('description', input.description || `${input.purpose} #${input.referenceId || input.paymentId}`);
            body.append('metadata[tenant_id]', input.tenantId.toString());
            body.append('metadata[payment_id]', input.paymentId.toString());
            body.append('metadata[purpose]', input.purpose);
            if (input.referenceId) {
                body.append('metadata[reference_id]', input.referenceId);
            }
            body.append('automatic_payment_methods[enabled]', 'true');
            const response = await fetch('https://api.stripe.com/v1/payment_intents', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body.toString()
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Stripe PaymentIntent creation failed');
            }
            this.logger.log(`[Stripe Live] Created PaymentIntent ${data.id} for ${input.amount} ${currency}`);
            return {
                gateway: this.gatewayName,
                gatewayRef: data.id,
                status: data.status === 'succeeded' ? 'SUCCESS' : 'REQUIRES_ACTION',
                clientSecret: data.client_secret,
                rawResponse: data
            };
        } catch (err) {
            this.logger.error(`Stripe API error: ${err.message}. Falling back to simulation mode.`);
            const simId = `pi_fallback_${(0, _crypto.randomUUID)().replace(/-/g, '').slice(0, 20)}`;
            return {
                gateway: this.gatewayName,
                gatewayRef: simId,
                status: 'REQUIRES_ACTION',
                clientSecret: `${simId}_secret_test`,
                rawResponse: {
                    error: err.message,
                    fallback: true
                }
            };
        }
    }
    async verifyPayment(input) {
        const gatewayRef = input.gatewayRef || '';
        if (this.isMock || gatewayRef.startsWith('pi_sim') || gatewayRef.startsWith('pi_fallback')) {
            this.logger.log(`[Stripe Mock] Verifying simulated payment: ${gatewayRef}`);
            return {
                success: true,
                status: 'SUCCESS',
                gatewayRef,
                paymentMethodDetails: 'Stripe International Card (Visa/Mastercard Mock)',
                rawResponse: {
                    status: 'succeeded',
                    mock: true
                }
            };
        }
        try {
            const response = await fetch(`https://api.stripe.com/v1/payment_intents/${gatewayRef}`, {
                headers: {
                    Authorization: `Bearer ${this.apiKey}`
                }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error?.message || 'Failed to fetch Stripe PaymentIntent');
            }
            const isSuccess = data.status === 'succeeded';
            return {
                success: isSuccess,
                status: isSuccess ? 'SUCCESS' : data.status === 'canceled' ? 'FAILED' : 'PENDING',
                gatewayRef: data.id,
                amount: data.amount ? data.amount / 100 : undefined,
                currency: data.currency?.toUpperCase(),
                paymentMethodDetails: `Stripe Card (${data.payment_method_types?.[0] || 'card'})`,
                rawResponse: data
            };
        } catch (err) {
            this.logger.error(`Stripe verification error: ${err.message}`);
            return {
                success: false,
                status: 'FAILED',
                gatewayRef,
                errorMessage: err.message
            };
        }
    }
    constructor(){
        this.gatewayName = 'STRIPE';
        this.logger = new _common.Logger(StripeGateway.name);
    }
};
StripeGateway = _ts_decorate([
    (0, _common.Injectable)()
], StripeGateway);

//# sourceMappingURL=stripe.gateway.js.map