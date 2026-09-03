"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReportsController", {
    enumerable: true,
    get: function() {
        return ReportsController;
    }
});
const _common = require("@nestjs/common");
const _reportsservice = require("./reports.service");
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
let ReportsController = class ReportsController {
    dailySales(user, date) {
        return this.reportsService.getDailySales(user.tenant_id, date);
    }
    summary(user) {
        return this.reportsService.getSummary(user.tenant_id);
    }
    constructor(reportsService){
        this.reportsService = reportsService;
    }
};
_ts_decorate([
    (0, _common.Get)('daily-sales'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Query)('date')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], ReportsController.prototype, "dailySales", null);
_ts_decorate([
    (0, _common.Get)('summary'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], ReportsController.prototype, "summary", null);
ReportsController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('reports'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _reportsservice.ReportsService === "undefined" ? Object : _reportsservice.ReportsService
    ])
], ReportsController);

//# sourceMappingURL=reports.controller.js.map