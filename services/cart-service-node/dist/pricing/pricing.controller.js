"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PricingController", {
    enumerable: true,
    get: function() {
        return PricingController;
    }
});
const _common = require("@nestjs/common");
const _pricingservice = require("./pricing.service");
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
let PricingController = class PricingController {
    calculatePricing(user, body) {
        return this.pricingService.calculatePricing(user.tenant_id, body);
    }
    constructor(pricingService){
        this.pricingService = pricingService;
    }
};
_ts_decorate([
    (0, _common.Post)('calculate'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], PricingController.prototype, "calculatePricing", null);
PricingController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('pricing'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _pricingservice.PricingService === "undefined" ? Object : _pricingservice.PricingService
    ])
], PricingController);

//# sourceMappingURL=pricing.controller.js.map