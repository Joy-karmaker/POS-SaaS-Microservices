"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "OrdersModule", {
    enumerable: true,
    get: function() {
        return OrdersModule;
    }
});
const _common = require("@nestjs/common");
const _ordersservice = require("./orders.service");
const _orderscontroller = require("./orders.controller");
const _tenantmodule = require("../tenant/tenant.module");
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
let OrdersModule = class OrdersModule {
};
OrdersModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _tenantmodule.TenantModule
        ],
        controllers: [
            _orderscontroller.OrdersController
        ],
        providers: [
            _ordersservice.OrdersService
        ],
        exports: [
            _ordersservice.OrdersService
        ]
    })
], OrdersModule);

//# sourceMappingURL=orders.module.js.map