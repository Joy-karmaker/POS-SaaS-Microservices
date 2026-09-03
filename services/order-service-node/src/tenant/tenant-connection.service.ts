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

  async getClient(tenantId: number): Promise<PrismaClient> {
    const tid = Number(tenantId);
    if (!tid || isNaN(tid)) {
      throw new NotFoundException(`Invalid tenant ID: ${tenantId}`);
    }

    if (this.tenantClients.has(tid)) {
      return this.tenantClients.get(tid)!;
    }

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

    const tenantPool = new Pool({
      connectionString: tenantConnectionString,
      max: 10,
      idleTimeoutMillis: 30000,
    });

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

  private async ensureTenantSchema(pool: Pool, dbName: string) {
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

        CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

        CREATE TABLE IF NOT EXISTS order_items (
          id BIGSERIAL PRIMARY KEY,
          order_id BIGINT NOT NULL,
          product_id INT NOT NULL,
          product_name VARCHAR(255) NOT NULL,
          quantity INT NOT NULL,
          unit_price DECIMAL(12,2) NOT NULL,
          total_price DECIMAL(12,2) NOT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
      `);
      this.logger.log(`Verified orders schema in tenant DB: ${dbName}`);
    } catch (err: any) {
      this.logger.error(`Failed to verify orders schema in ${dbName}: ${err.message}`);
    }
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
