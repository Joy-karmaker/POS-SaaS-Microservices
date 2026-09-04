"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RestockController", {
    enumerable: true,
    get: function() {
        return RestockController;
    }
});
const _common = require("@nestjs/common");
const _restockservice = require("./restock.service");
const _createrestockorderdto = require("./dto/create-restock-order.dto");
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
let RestockController = class RestockController {
    create(user, dto) {
        return this.restockService.create(user.tenant_id, user, dto);
    }
    findAll(user, status) {
        return this.restockService.findAll(user.tenant_id, {
            status
        });
    }
    findOne(user, id) {
        return this.restockService.findOne(user.tenant_id, +id);
    }
    dispatch(user, id) {
        return this.restockService.dispatch(user.tenant_id, +id);
    }
    receive(user, id) {
        return this.restockService.markReceived(user.tenant_id, +id);
    }
    cancel(user, id) {
        return this.restockService.cancel(user.tenant_id, +id);
    }
    markPaid(user, id, body) {
        return this.restockService.markPaid(user.tenant_id, +id, body);
    }
    constructor(restockService){
        this.restockService = restockService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _createrestockorderdto.CreateRestockOrderDto === "undefined" ? Object : _createrestockorderdto.CreateRestockOrderDto
    ]),
    _ts_metadata("design:returntype", void 0)
], RestockController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Query)('status')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], RestockController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], RestockController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Post)(':id/dispatch'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], RestockController.prototype, "dispatch", null);
_ts_decorate([
    (0, _common.Post)(':id/receive'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], RestockController.prototype, "receive", null);
_ts_decorate([
    (0, _common.Post)(':id/cancel'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], RestockController.prototype, "cancel", null);
_ts_decorate([
    (0, _common.Post)(':id/mark-paid'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_param(2, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        Object
    ]),
    _ts_metadata("design:returntype", void 0)
], RestockController.prototype, "markPaid", null);
RestockController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('restock'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _restockservice.RestockService === "undefined" ? Object : _restockservice.RestockService
    ])
], RestockController);

//# sourceMappingURL=restock.controller.js.map