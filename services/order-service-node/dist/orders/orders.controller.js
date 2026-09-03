"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrdersController", {
    enumerable: true,
    get: function() {
        return OrdersController;
    }
});
const _common = require("@nestjs/common");
const _ordersservice = require("./orders.service");
const _createorderdto = require("./dto/create-order.dto");
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
let OrdersController = class OrdersController {
    create(user, dto) {
        return this.ordersService.create(user.tenant_id, user, dto);
    }
    findAll(user, status, storeId) {
        return this.ordersService.findByTenant(user.tenant_id, {
            status,
            storeId
        });
    }
    findOne(user, id) {
        return this.ordersService.findOne(user.tenant_id, +id);
    }
    cancel(user, id) {
        return this.ordersService.cancelOrder(user.tenant_id, +id);
    }
    constructor(ordersService){
        this.ordersService = ordersService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _createorderdto.CreateOrderDto === "undefined" ? Object : _createorderdto.CreateOrderDto
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Query)('status')),
    _ts_param(2, (0, _common.Query)('store_id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], OrdersController.prototype, "findAll", null);
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
], OrdersController.prototype, "findOne", null);
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
], OrdersController.prototype, "cancel", null);
OrdersController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('orders'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _ordersservice.OrdersService === "undefined" ? Object : _ordersservice.OrdersService
    ])
], OrdersController);

//# sourceMappingURL=orders.controller.js.map