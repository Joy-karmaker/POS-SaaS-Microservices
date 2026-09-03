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
        await this.ensureSchema();
    }
    async ensureSchema() {
        try {
            await this.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS daily_sales (
          id BIGSERIAL PRIMARY KEY,
          tenant_id BIGINT NOT NULL,
          date DATE NOT NULL,
          total_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
          total_orders INT NOT NULL DEFAULT 0,
          total_items INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_sales_tenant_date ON daily_sales (tenant_id, date);

        CREATE TABLE IF NOT EXISTS hourly_sales (
          id BIGSERIAL PRIMARY KEY,
          tenant_id BIGINT NOT NULL,
          hour TIMESTAMP NOT NULL,
          total_sales DECIMAL(12,2) NOT NULL DEFAULT 0,
          total_orders INT NOT NULL DEFAULT 0
        );
        CREATE UNIQUE INDEX IF NOT EXISTS uq_hourly_sales_tenant_hour ON hourly_sales (tenant_id, hour);

        CREATE TABLE IF NOT EXISTS sale_events (
          id BIGSERIAL PRIMARY KEY,
          event_id VARCHAR(36) NOT NULL UNIQUE,
          tenant_id BIGINT NOT NULL,
          order_id INT NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);
            this.logger.log('Verified reporting schema');
        } catch (err) {
            this.logger.error(`Failed to verify reporting schema: ${err.message}`);
        }
    }
    async enableShutdownHooks(app) {
        this.$on('beforeExit', async ()=>{
            await app.close();
        });
    }
    constructor(){
        const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@postgres:5432/reporting';
        const adapter = new _adapterpg.PrismaPg(dbUrl);
        super({
            adapter
        }), this.logger = new _common.Logger(PrismaService.name);
    }
};
PrismaService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], PrismaService);

//# sourceMappingURL=prisma.service.js.map