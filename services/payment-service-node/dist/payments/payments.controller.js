"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PaymentsController", {
    enumerable: true,
    get: function() {
        return PaymentsController;
    }
});
const _common = require("@nestjs/common");
const _paymentsservice = require("./payments.service");
const _createpaymentdto = require("./dto/create-payment.dto");
const _initiatepaymentdto = require("./dto/initiate-payment.dto");
const _jwtauthguard = require("../auth/jwt-auth.guard");
const _currentuserdecorator = require("../auth/current-user.decorator");
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
function _ts_metadata(metadataKey, metadataValue) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") {
        return Reflect.metadata(metadataKey, metadataValue);
    }
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let PaymentsController = class PaymentsController {
    /**
   * Initiate a payment session for POS Sale or Warehouse Restock.
   */ initiate(user, dto) {
        return this.paymentsService.initiate(user.tenant_id, user, dto);
    }
    /**
   * Verify and settle a payment (called after client completes Stripe Elements or SSLCOMMERZ redirect).
   */ verify(user, dto) {
        return this.paymentsService.verifyAndSettle(user.tenant_id, user, dto);
    }
    /**
   * Legacy checkout endpoint (backward compatibility with existing POS).
   */ pay(user, dto) {
        return this.paymentsService.pay(user.tenant_id, user, dto);
    }
    findAll(user) {
        return this.paymentsService.findByTenant(user.tenant_id);
    }
    findOne(user, id) {
        return this.paymentsService.findOne(user.tenant_id, +id);
    }
    /**
   * SSLCOMMERZ IPN Webhook listener (Public, verified via validation server API).
   */ async sslcommerzIpn(body) {
        this.logger.log(`Received SSLCOMMERZ IPN callback: tran_id=${body?.tran_id}, val_id=${body?.val_id}`);
        const tenantId = Number(body?.value_a);
        const paymentId = body?.value_b;
        if (!tenantId || !paymentId) {
            this.logger.warn('SSLCOMMERZ IPN missing value_a (tenantId) or value_b (paymentId)');
            return {
                status: 'IGNORED'
            };
        }
        return this.paymentsService.verifyAndSettle(tenantId, null, {
            payment_id: paymentId,
            gateway: 'SSLCOMMERZ',
            gateway_ref: body?.tran_id,
            verification_data: body
        });
    }
    /**
   * SSLCOMMERZ Browser Redirect Success listener.
   */ async sslcommerzSuccess(body, res) {
        this.logger.log(`Received SSLCOMMERZ success redirect for tran_id: ${body?.tran_id}`);
        const tenantId = Number(body?.value_a);
        const paymentId = body?.value_b;
        if (tenantId && paymentId) {
            try {
                await this.paymentsService.verifyAndSettle(tenantId, null, {
                    payment_id: paymentId,
                    gateway: 'SSLCOMMERZ',
                    gateway_ref: body?.tran_id,
                    verification_data: body
                });
            } catch (err) {
                this.logger.warn(`SSLCOMMERZ redirect verification warning: ${err.message}`);
            }
        }
        // Redirect user back to frontend confirmation page
        const purpose = body?.value_c || 'POS_SALE';
        const redirectPath = purpose === 'RESTOCK_ORDER' ? '/tenant/restock' : '/tenant/pos';
        return res.redirect(`${redirectPath}?payment_status=success&payment_id=${paymentId}`);
    }
    /**
   * Stripe Webhook listener (Public, verified via Stripe event metadata).
   */ async stripeWebhook(body, signature) {
        this.logger.log(`Received Stripe Webhook event: ${body?.type}`);
        if (body?.type === 'payment_intent.succeeded') {
            const pi = body.data?.object;
            const tenantId = Number(pi?.metadata?.tenant_id);
            const paymentId = pi?.metadata?.payment_id;
            if (tenantId && paymentId) {
                return this.paymentsService.verifyAndSettle(tenantId, null, {
                    payment_id: paymentId,
                    gateway: 'STRIPE',
                    gateway_ref: pi.id,
                    verification_data: pi
                });
            }
        }
        return {
            received: true
        };
    }
    constructor(paymentsService){
        this.paymentsService = paymentsService;
        this.logger = new _common.Logger(PaymentsController.name);
    }
};
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Post)('initiate'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _initiatepaymentdto.InitiatePaymentDto === "undefined" ? Object : _initiatepaymentdto.InitiatePaymentDto
    ]),
    _ts_metadata("design:returntype", void 0)
], PaymentsController.prototype, "initiate", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Post)('verify'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _initiatepaymentdto.VerifyPaymentDto === "undefined" ? Object : _initiatepaymentdto.VerifyPaymentDto
    ]),
    _ts_metadata("design:returntype", void 0)
], PaymentsController.prototype, "verify", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Post)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _createpaymentdto.CreatePaymentDto === "undefined" ? Object : _createpaymentdto.CreatePaymentDto
    ]),
    _ts_metadata("design:returntype", void 0)
], PaymentsController.prototype, "pay", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Get)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Get)(':id'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], PaymentsController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Post)('webhooks/sslcommerz/ipn'),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PaymentsController.prototype, "sslcommerzIpn", null);
_ts_decorate([
    (0, _common.Post)('webhooks/sslcommerz/success'),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Res)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", Promise)
], PaymentsController.prototype, "sslcommerzSuccess", null);
_ts_decorate([
    (0, _common.Post)('webhooks/stripe'),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Headers)('stripe-signature')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", Promise)
], PaymentsController.prototype, "stripeWebhook", null);
PaymentsController = _ts_decorate([
    (0, _common.Controller)('payments'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _paymentsservice.PaymentsService === "undefined" ? Object : _paymentsservice.PaymentsService
    ])
], PaymentsController);

//# sourceMappingURL=payments.controller.js.map