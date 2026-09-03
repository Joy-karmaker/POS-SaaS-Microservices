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
    pay(user, dto) {
        return this.paymentsService.pay(user.tenant_id, user, dto);
    }
    findAll(user) {
        return this.paymentsService.findByTenant(user.tenant_id);
    }
    constructor(paymentsService){
        this.paymentsService = paymentsService;
    }
};
_ts_decorate([
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
    (0, _common.Get)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], PaymentsController.prototype, "findAll", null);
PaymentsController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('payments'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _paymentsservice.PaymentsService === "undefined" ? Object : _paymentsservice.PaymentsService
    ])
], PaymentsController);

//# sourceMappingURL=payments.controller.js.map