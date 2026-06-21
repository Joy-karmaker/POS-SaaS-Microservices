"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InventoryController", {
    enumerable: true,
    get: function() {
        return InventoryController;
    }
});
const _common = require("@nestjs/common");
const _inventoryservice = require("./inventory.service");
const _adjuststockdto = require("./dto/adjust-stock.dto");
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
let InventoryController = class InventoryController {
    adjustStock(user, adjustStockDto) {
        return this.inventoryService.adjustStock(user.tenant_id, adjustStockDto);
    }
    getStock(user, productId) {
        return this.inventoryService.getStock(user.tenant_id, +productId);
    }
    constructor(inventoryService){
        this.inventoryService = inventoryService;
    }
};
_ts_decorate([
    (0, _common.Post)('adjust'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        typeof _adjuststockdto.AdjustStockDto === "undefined" ? Object : _adjuststockdto.AdjustStockDto
    ]),
    _ts_metadata("design:returntype", void 0)
], InventoryController.prototype, "adjustStock", null);
_ts_decorate([
    (0, _common.Get)(':productId'),
    _ts_param(0, (0, _currentuserdecorator.CurrentUser)()),
    _ts_param(1, (0, _common.Param)('productId')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        Object,
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], InventoryController.prototype, "getStock", null);
InventoryController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard),
    (0, _common.Controller)('inventory'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _inventoryservice.InventoryService === "undefined" ? Object : _inventoryservice.InventoryService
    ])
], InventoryController);

//# sourceMappingURL=inventory.controller.js.map