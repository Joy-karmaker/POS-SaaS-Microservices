import { Injectable, OnModuleDestroy, NotFoundException, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class TenantConnectionService implements OnModuleDestroy {
  private readonly logger = new Logger(TenantConnectionService.name);
  private controlPlanePool: Pool;
  private tenantClients = new Map<number, PrismaClient>();
  private tenantPools = new Map<number, Pool>();
  private initializedDatabases = new Set<string>();

  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT) || 5432;
    const user = process.env.DB_USERNAME || 'postgres';
    const password = process.env.DB_PASSWORD || '';

    this.controlPlanePool = new Pool({
      host,
      port,
      user,
      password,
      database: 'control_plane',
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }

  /**
   * Resolves or creates a dedicated PrismaClient instance for a given tenant ID.
   */
  async getClient(tenantId: number): Promise<PrismaClient> {
    const tid = Number(tenantId);
    if (!tid || isNaN(tid)) {
      throw new NotFoundException(`Invalid tenant ID: ${tenantId}`);
    }

    // 1. Return cached tenant Prisma client if already connected
    if (this.tenantClients.has(tid)) {
      return this.tenantClients.get(tid)!;
    }

    // 2. Lookup tenant DB details from control plane
    const result = await this.controlPlanePool.query(
      'SELECT id, name, db_name, db_username FROM tenants WHERE id = $1',
      [tid],
    );

    if (result.rows.length === 0) {
      throw new NotFoundException(`Tenant #${tid} not found in control plane`);
    }

    const tenant = result.rows[0];
    const dbName = tenant.db_name;

    const host = process.env.DB_HOST || 'localhost';
    const port = Number(process.env.DB_PORT) || 5432;
    const user = process.env.DB_USERNAME || 'postgres';
    const password = process.env.DB_PASSWORD || '';

    const tenantConnectionString = `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${dbName}`;

    // 3. Create dedicated pg pool and PrismaPg adapter
    const tenantPool = new Pool({
      connectionString: tenantConnectionString,
      max: 10,
      idleTimeoutMillis: 30000,
    });

    // 4. Ensure tenant schema tables exist (self-healing migration)
    if (!this.initializedDatabases.has(dbName)) {
      await this.ensureTenantSchema(tenantPool, dbName);
      this.initializedDatabases.add(dbName);
    }

    const adapter = new PrismaPg(tenantPool);
    const client = new PrismaClient({ adapter });
    await client.$connect();

    this.tenantPools.set(tid, tenantPool);
    this.tenantClients.set(tid, client);

    this.logger.log(`Initialized dedicated tenant database connection for Tenant #${tid} (${dbName})`);
    return client;
  }

  async getPool(tenantId: number): Promise<Pool> {
    await this.getClient(tenantId);
    return this.tenantPools.get(Number(tenantId))!;
  }

  /**
   * Self-healing schema migration to ensure all required tables and columns exist in the tenant DB.
   */
  private async ensureTenantSchema(pool: Pool, dbName: string) {
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

        CREATE TABLE IF NOT EXISTS restock_orders (
          id SERIAL PRIMARY KEY,
          order_number VARCHAR(64) NOT NULL UNIQUE,
          warehouse_name VARCHAR(255) NOT NULL DEFAULT 'Central Distribution Hub',
          status VARCHAR(32) NOT NULL DEFAULT 'REQUESTED',
          total_items INT NOT NULL DEFAULT 0,
          total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00,
          payment_status VARCHAR(32) NOT NULL DEFAULT 'UNPAID',
          payment_id BIGINT NULL,
          payment_gateway VARCHAR(64) NULL,
          notes TEXT NULL,
          requested_by VARCHAR(255) NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          received_at TIMESTAMP NULL
        );

        DO $$
        BEGIN
          ALTER TABLE restock_orders ADD COLUMN IF NOT EXISTS total_cost DECIMAL(12,2) NOT NULL DEFAULT 0.00;
          ALTER TABLE restock_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(32) NOT NULL DEFAULT 'UNPAID';
          ALTER TABLE restock_orders ADD COLUMN IF NOT EXISTS payment_id BIGINT NULL;
          ALTER TABLE restock_orders ADD COLUMN IF NOT EXISTS payment_gateway VARCHAR(64) NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END $$;

        CREATE INDEX IF NOT EXISTS idx_restock_orders_status ON restock_orders (status);
        CREATE INDEX IF NOT EXISTS idx_restock_orders_payment_status ON restock_orders (payment_status);

        CREATE TABLE IF NOT EXISTS restock_order_items (
          id SERIAL PRIMARY KEY,
          restock_order_id INT NOT NULL,
          product_id INT NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          sku VARCHAR(100) NULL,
          quantity INT NOT NULL,
          cost_price DECIMAL(12,2) NOT NULL DEFAULT 0,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_restock_order FOREIGN KEY (restock_order_id) REFERENCES restock_orders(id) ON DELETE CASCADE,
          CONSTRAINT fk_restock_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_restock_items_order ON restock_order_items (restock_order_id);
      `);
      this.logger.log(`Verified schema in tenant DB: ${dbName}`);
    } catch (err: any) {
      this.logger.error(`Failed to verify schema in ${dbName}: ${err.message}`);
    }
  }

  /**
   * Idempotency helper: check whether a domain event was already processed
   * by the given consumer (backed by control_plane.processed_events).
   */
  async isProcessed(consumer: string, eventId: string): Promise<boolean> {
    const result = await this.controlPlanePool.query(
      'SELECT 1 FROM processed_events WHERE event_id = $1 AND consumer = $2',
      [eventId, consumer],
    );
    return result.rows.length > 0;
  }

  /**
   * Idempotency helper: record a processed domain event (no-op if already recorded).
   */
  async markProcessed(consumer: string, eventId: string): Promise<void> {
    await this.controlPlanePool.query(
      'INSERT INTO processed_events (event_id, consumer, processed_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
      [eventId, consumer],
    );
  }

  async onModuleDestroy() {
    this.logger.log('Closing all tenant database connections...');
    for (const [tid, client] of this.tenantClients.entries()) {
      try {
        await client.$disconnect();
      } catch (err: any) {
        this.logger.warn(`Error disconnecting tenant #${tid} client: ${err.message}`);
      }
    }
    for (const [tid, pool] of this.tenantPools.entries()) {
      try {
        await pool.end();
      } catch (err: any) {
        this.logger.warn(`Error ending tenant #${tid} pool: ${err.message}`);
      }
    }
    try {
      await this.controlPlanePool.end();
    } catch (err: any) {
      this.logger.warn(`Error ending control plane pool: ${err.message}`);
    }
  }
}
