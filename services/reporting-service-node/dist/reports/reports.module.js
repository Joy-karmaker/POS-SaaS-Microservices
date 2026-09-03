"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ReportsModule", {
    enumerable: true,
    get: function() {
        return ReportsModule;
    }
});
const _common = require("@nestjs/common");
const _reportsservice = require("./reports.service");
const _reportscontroller = require("./reports.controller");
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
let ReportsModule = class ReportsModule {
};
ReportsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _rabbitmqmodule.RabbitMqModule
        ],
        controllers: [
            _reportscontroller.ReportsController
        ],
        providers: [
            _reportsservice.ReportsService
        ]
    })
], ReportsModule);

//# sourceMappingURL=reports.module.js.map