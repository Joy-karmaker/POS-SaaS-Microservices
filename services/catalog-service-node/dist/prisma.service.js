"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PrismaService", {
    enumerable: true,
    get: function() {
        return PrismaService;
    }
});
const _common = require("@nestjs/common");
const _client = require("@prisma/client");
const _adapterpg = require("@prisma/adapter-pg");
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
let PrismaService = class PrismaService extends _client.PrismaClient {
    async onModuleInit() {
        await this.$connect();
    }
    async enableShutdownHooks(app) {
        this.$on('beforeExit', async ()=>{
            await app.close();
        });
    }
    constructor(){
        const dbUrl = process.env.DATABASE_URL || `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/control_plane`;
        const adapter = new _adapterpg.PrismaPg(dbUrl);
        super({
            adapter
        });
    }
};
PrismaService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], PrismaService);

//# sourceMappingURL=prisma.service.js.map