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
    /**
   * Resolves or creates a dedicated PrismaClient instance for a given tenant ID.
   */ async getClient(tenantId) {
        const tid = Number(tenantId);
        if (!tid || isNaN(tid)) {
            throw new _common.NotFoundException(`Invalid tenant ID: ${tenantId}`);
        }
        // 1. Return cached tenant Prisma client if already connected
        if (this.tenantClients.has(tid)) {
            return this.tenantClients.get(tid);
        }
        // 2. Lookup tenant DB details from control plane
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
        // 3. Create dedicated pg pool and PrismaPg adapter
        const tenantPool = new _pg.Pool({
            connectionString: tenantConnectionString,
            max: 10,
            idleTimeoutMillis: 30000
        });
        // 4. Ensure tenant schema tables exist (self-healing migration)
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
    /**
   * Self-healing schema migration to ensure all required tables and columns exist in the tenant DB.
   */ async ensureTenantSchema(pool, dbName) {
        try {
            await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS products (
          id SERIAL PRIMARY KEY,
          category_id INT NULL,
          name VARCHAR(255) NOT NULL,
          sku VARCHAR(100) NULL,
          barcode VARCHAR(100) NULL,
          price DECIMAL(12,2) NOT NULL,
          cost_price DECIMAL(12,2) NULL,
          stock_quantity INT NOT NULL DEFAULT 0,
          is_active BOOLEAN NOT NULL DEFAULT TRUE,
          sales_velocity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
          stock_out_date TIMESTAMP NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
        CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
        CREATE INDEX IF NOT EXISTS idx_products_stock_out ON products (stock_out_date);

        CREATE TABLE IF NOT EXISTS sales (
          id SERIAL PRIMARY KEY,
          total_amount DECIMAL(12,2) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales (created_at);

        CREATE TABLE IF NOT EXISTS sale_items (
          id SERIAL PRIMARY KEY,
          sale_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          price DECIMAL(12,2) NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items (sale_id);
        CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items (product_id);
      `);
            this.logger.log(`Verified schema in tenant DB: ${dbName}`);
        } catch (err) {
            this.logger.error(`Failed to verify schema in ${dbName}: ${err.message}`);
        }
    }
    /**
   * Idempotency helper: check whether a domain event was already processed
   * by the given consumer (backed by control_plane.processed_events).
   */ async isProcessed(consumer, eventId) {
        const result = await this.controlPlanePool.query('SELECT 1 FROM processed_events WHERE event_id = $1 AND consumer = $2', [
            eventId,
            consumer
        ]);
        return result.rows.length > 0;
    }
    /**
   * Idempotency helper: record a processed domain event (no-op if already recorded).
   */ async markProcessed(consumer, eventId) {
        await this.controlPlanePool.query('INSERT INTO processed_events (event_id, consumer, processed_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING', [
            eventId,
            consumer
        ]);
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