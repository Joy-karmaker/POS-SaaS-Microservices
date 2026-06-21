"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AnalyticsModule", {
    enumerable: true,
    get: function() {
        return AnalyticsModule;
    }
});
const _common = require("@nestjs/common");
const _analyticsservice = require("./analytics.service");
const _analyticscontroller = require("./analytics.controller");
const _inventorymodule = require("../inventory/inventory.module");
const _prismaservice = require("../prisma.service");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let AnalyticsModule = class AnalyticsModule {
};
AnalyticsModule = _ts_decorate([
    (0, _common.Module)({
        imports: [
            _inventorymodule.InventoryModule
        ],
        controllers: [
            _analyticscontroller.AnalyticsController
        ],
        providers: [
            _analyticsservice.AnalyticsService,
            _prismaservice.PrismaService
        ],
        exports: [
            _analyticsservice.AnalyticsService
        ]
    })
], AnalyticsModule);

//# sourceMappingURL=analytics.module.js.map