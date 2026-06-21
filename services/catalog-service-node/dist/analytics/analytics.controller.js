"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AnalyticsController", {
    enumerable: true,
    get: function() {
        return AnalyticsController;
    }
});
const _common = require("@nestjs/common");
const _analyticsservice = require("./analytics.service");
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
let AnalyticsController = class AnalyticsController {
    getSummary(user) {
        return this.analyticsService.getAnalyticsSummary(Number(user.tenant_id));
    }
    getForecast(user, page, limit) {
        const p = page ? parseInt(page, 10) : 1;
        const l = limit ? parseInt(limit, 10) : 10;
        return this.analyticsService.getForecastList(Number(user.tenant_id), p, l);
    }
    seedSales(user, count) {
        const recordCount = count ? parseInt(count, 10) : 1000;
        return this.analyticsService.seedSimulationSales(Number(user.tenant_id), recordCount);
    }
    recalculate(user) {
        return this.analyticsService.recalculateAllProductsForecast(Number(user.tenant_id));
    }
    constructor(analyticsService){
        this.analyticsService = analyticsService;
    }
};
_ts_decorate([
    (0, _common.Get)('summary'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getSummary", null);
_ts_decorate([
    (0, _common.Get)('forecast'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Query)('page')),
    _ts_param(2, (0, _common.Query)('limit')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getForecast", null);
_ts_decorate([
    (0, _common.Post)('seed-sales'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)('count')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        Number
    ]),
    _ts_metadata("design:returntype", void 0)
], AnalyticsController.prototype, "seedSales", null);
_ts_decorate([
    (0, _common.Post)('recalculate'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], AnalyticsController.prototype, "recalculate", null);
AnalyticsController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('analytics'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _analyticsservice.AnalyticsService === "undefined" ? Object : _analyticsservice.AnalyticsService
    ])
], AnalyticsController);

//# sourceMappingURL=analytics.controller.js.map