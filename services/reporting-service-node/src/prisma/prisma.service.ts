import { Injectable, OnModuleInit, INestApplication, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const dbUrl =
      process.env.DATABASE_URL ||
      'postgresql://postgres:postgres@postgres:5432/reporting';
    const adapter = new PrismaPg(dbUrl);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
    await this.ensureSchema();
  }

  private async ensureSchema() {
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
    } catch (err: any) {
      this.logger.error(`Failed to verify reporting schema: ${err.message}`);
    }
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit' as never, async () => {
      await app.close();
    });
  }
}
