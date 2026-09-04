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

  async getPool(tenantId: number): Promise<Pool> {
    await this.getClient(tenantId);
    return this.tenantPools.get(Number(tenantId))!;
  }

  private async ensureTenantSchema(pool: Pool, dbName: string) {
    try {
      await pool.query(`
        -- Drop obsolete order tables if any
        DROP TABLE IF EXISTS order_items CASCADE;
        DROP TABLE IF EXISTS orders CASCADE;

        CREATE TABLE IF NOT EXISTS payments (
          id BIGSERIAL PRIMARY KEY,
          order_id BIGINT NULL,
          purpose VARCHAR(32) NOT NULL DEFAULT 'POS_SALE',
          reference_id VARCHAR(128) NULL,
          method VARCHAR(32) NOT NULL,
          gateway VARCHAR(64) NULL,
          amount DECIMAL(12,2) NOT NULL,
          amount_cents BIGINT NULL,
          currency VARCHAR(16) NOT NULL DEFAULT 'BDT',
          status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
          idempotency_key VARCHAR(255) NULL UNIQUE,
          gateway_ref VARCHAR(255) NULL,
          client_secret VARCHAR(512) NULL,
          receipt_number VARCHAR(64) NULL,
          metadata TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        -- Self-healing column additions for existing payments table
        DO $$
        BEGIN
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS purpose VARCHAR(32) NOT NULL DEFAULT 'POS_SALE';
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_id VARCHAR(128) NULL;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS gateway VARCHAR(64) NULL;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS amount_cents BIGINT NULL;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS currency VARCHAR(16) NOT NULL DEFAULT 'BDT';
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS client_secret VARCHAR(512) NULL;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(64) NULL;
          ALTER TABLE payments ADD COLUMN IF NOT EXISTS metadata TEXT NULL;
          ALTER TABLE payments ALTER COLUMN order_id DROP NOT NULL;
        EXCEPTION WHEN OTHERS THEN NULL;
        END $$;

        DO $$
        BEGIN
          ALTER TABLE payments DROP CONSTRAINT IF EXISTS fk_payments_order;
        EXCEPTION WHEN OTHERS THEN NULL;
        END $$;

        CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id);
        CREATE INDEX IF NOT EXISTS idx_payments_purpose_ref ON payments (purpose, reference_id);
        CREATE INDEX IF NOT EXISTS idx_payments_idempotency ON payments (idempotency_key);

        CREATE TABLE IF NOT EXISTS payment_attempts (
          id BIGSERIAL PRIMARY KEY,
          payment_id BIGINT NOT NULL,
          attempt_number INT NOT NULL DEFAULT 1,
          gateway VARCHAR(64) NOT NULL,
          gateway_ref VARCHAR(255) NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
          request_payload TEXT NULL,
          response_payload TEXT NULL,
          error_message TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_payment_attempts_payment ON payment_attempts (payment_id);

        CREATE TABLE IF NOT EXISTS outbox_events (
          id BIGSERIAL PRIMARY KEY,
          aggregate_type VARCHAR(64) NOT NULL,
          aggregate_id VARCHAR(64) NOT NULL,
          event_type VARCHAR(128) NOT NULL,
          payload TEXT NOT NULL,
          status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
          retry_count INT NOT NULL DEFAULT 0,
          error_message TEXT NULL,
          created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          published_at TIMESTAMP NULL
        );
        CREATE INDEX IF NOT EXISTS idx_outbox_events_status ON outbox_events (status);
        CREATE INDEX IF NOT EXISTS idx_outbox_events_created ON outbox_events (created_at);
      `);
      this.logger.log(`Verified orders/payments/outbox schema in tenant DB: ${dbName}`);
    } catch (err: any) {
      this.logger.error(`Failed to verify orders/payments schema in ${dbName}: ${err.message}`);
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
