"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RedisService", {
    enumerable: true,
    get: function() {
        return RedisService;
    }
});
const _common = require("@nestjs/common");
const _ioredis = /*#__PURE__*/ _interop_require_default(require("ioredis"));
function _interop_require_default(obj) {
    return obj && obj.__esModule ? obj : {
        default: obj
    };
}
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
let RedisService = class RedisService {
    onModuleInit() {
        const host = process.env.REDIS_HOST || 'pos-redis';
        const port = parseInt(process.env.REDIS_PORT || '6379', 10);
        this.client = new _ioredis.default({
            host,
            port
        });
    }
    onModuleDestroy() {
        this.client.disconnect();
    }
    getClient() {
        return this.client;
    }
};
RedisService = _ts_decorate([
    (0, _common.Injectable)()
], RedisService);

//# sourceMappingURL=redis.service.js.map