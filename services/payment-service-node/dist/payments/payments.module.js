"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PaymentsModule", {
    enumerable: true,
    get: function() {
        return PaymentsModule;
    }
});
const _common = require("@nestjs/common");
const _paymentsservice = require("./payments.service");
const _paymentscontroller = require("./payments.controller");
const _tenantmodule = require("../tenant/tenant.module");
const _rabbitmqmodule = require("../rabbitmq/rabbitmq.module");
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
let PaymentsModule = class PaymentsModule {
};
PaymentsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _tenantmodule.TenantModule,
            _rabbitmqmodule.RabbitMqModule
        ],
        controllers: [
            _paymentscontroller.PaymentsController
        ],
        providers: [
            _paymentsservice.PaymentsService
        ]
    })
], PaymentsModule);

//# sourceMappingURL=payments.module.js.map