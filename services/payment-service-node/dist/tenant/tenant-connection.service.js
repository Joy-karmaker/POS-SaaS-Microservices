"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "TenantConnectionService", {
    enumerable: true,
    get: function() {
        return TenantConnectionService;
    }
});
const _common = require("@nestjs/common");
const _client = require("@prisma/client");
const _adapterpg = require("@prisma/adapter-pg");
const _pg = require("pg");
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
let TenantConnectionService = class TenantConnectionService {
    async getClient(tenantId) {
        const tid = Number(tenantId);
        if (!tid || isNaN(tid)) {
            throw new _common.NotFoundException(`Invalid tenant ID: ${tenantId}`);
        }
        if (this.tenantClients.has(tid)) {
            return this.tenantClients.get(tid);
        }
        const result = await this.controlPlanePool.query('SELECT id, name, db_name, db_username FROM tenants WHERE id = $1', [
            tid
        ]);
        if (result.rows.length === 0) {
            throw new _common.NotFoundException(`Tenant #${tid} not found in control plane`);
        }
        const tenant = result.rows[0];
        const dbName = tenant.db_name;
        const host = process.env.DB_HOST || 'localhost';
        const port = Number(process.env.DB_PORT) || 5432;
        const user = process.env.DB_USERNAME || 'postgres';
        const password = process.env.DB_PASSWORD || '';
        const tenantConnectionString = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`;
        const tenantPool = new _pg.Pool({
            connectionString: tenantConnectionString,
            max: 10,
            idleTimeoutMillis: 30000
        });
        if (!this.initializedDatabases.has(dbName)) {
            await this.ensureTenantSchema(tenantPool, dbName);
            this.initializedDatabases.add(dbName);
        }
        const adapter = new _adapterpg.PrismaPg(tenantPool);
        const client = new _client.PrismaClient({
            adapter
        });
        await client.$connect();
        this.tenantPools.set(tid, tenantPool);
        this.tenantClients.set(tid, client);
        this.logger.log(`Initialized dedicated tenant database connection for Tenant #${tid} (${dbName})`);
        return client;
    }
    async ensureTenantSchema(pool, dbName) {
        try {
            await pool.query(`
        CREATE TABLE IF NOT EXISTS orders (
          id BIGSERIAL PRIMARY KEY,
          store_id BIGINT NULL,
          user_id BIGINT NULL,
          shift_id BIGINT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
          subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
          tax DECIMAL(12,2) NOT NULL DEFAULT 0,
          discount DECIMAL(12,2) NOT NULL DEFAULT 0,
          total DECIMAL(12,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS payments (
          id BIGSERIAL PRIMARY KEY,
          order_id BIGINT NOT NULL,
          method VARCHAR(32) NOT NULL,
          amount DECIMAL(12,2) NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
          idempotency_key VARCHAR(255) NULL UNIQUE,
          gateway_ref VARCHAR(255) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id);
        CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payments (idempotency_key);
      `);
            this.logger.log(`Verified orders/payments schema in tenant DB: ${dbName}`);
        } catch (err) {
            this.logger.error(`Failed to verify orders/payments schema in ${dbName}: ${err.message}`);
        }
    }
    async onModuleDestroy() {
        this.logger.log('Closing all tenant database connections...');
        for (const [tid, client] of this.tenantClients.entries()){
            try {
                await client.$disconnect();
            } catch (err) {
                this.logger.warn(`Error disconnecting tenant #${tid} client: ${err.message}`);
            }
        }
        for (const [tid, pool] of this.tenantPools.entries()){
            try {
                await pool.end();
            } catch (err) {
                this.logger.warn(`Error ending tenant #${tid} pool: ${err.message}`);
            }
        }
        try {
            await this.controlPlanePool.end();
        } catch (err) {
            this.logger.warn(`Error ending control plane pool: ${err.message}`);
        }
    }
    constructor(){
        this.logger = new _common.Logger(TenantConnectionService.name);
        this.tenantClients = new Map();
        this.tenantPools = new Map();
        this.initializedDatabases = new Set();
        const host = process.env.DB_HOST || 'localhost';
        const port = Number(process.env.DB_PORT) || 5432;
        const user = process.env.DB_USERNAME || 'postgres';
        const password = process.env.DB_PASSWORD || '';
        this.controlPlanePool = new _pg.Pool({
            host,
            port,
            user,
            password,
            database: 'control_plane',
            max: 5,
            idleTimeoutMillis: 30000
        });
    }
};
TenantConnectionService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], TenantConnectionService);

//# sourceMappingURL=tenant-connection.service.js.map