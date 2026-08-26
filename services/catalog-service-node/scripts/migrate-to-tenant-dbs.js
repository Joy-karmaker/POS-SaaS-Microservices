const { Pool } = require('pg');

async function runMigration() {
  const host = process.env.DB_HOST || 'postgres';
  const port = Number(process.env.DB_PORT) || 5432;
  const user = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || 'root';

  console.log(`Connecting to control_plane at ${host}:${port} as ${user}...`);

  const cpPool = new Pool({
    host,
    port,
    user,
    password,
    database: 'control_plane',
  });

  try {
    const tenantsRes = await cpPool.query('SELECT id, name, db_name, db_username FROM tenants');
    console.log(`Found ${tenantsRes.rows.length} tenants in control_plane.`);

    for (const tenant of tenantsRes.rows) {
      console.log(`\n--- Processing Tenant #${tenant.id} (${tenant.name} -> ${tenant.db_name}) ---`);

      const tenantPool = new Pool({
        host,
        port,
        user,
        password,
        database: tenant.db_name,
      });

      try {
        console.log(`Ensuring full schema in ${tenant.db_name}...`);

        // 1. Categories
        await tenantPool.query(`
          CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            description TEXT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // 2. Products table & columns
        await tenantPool.query(`
          CREATE TABLE IF NOT EXISTS products (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            price DECIMAL(12,2) NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
          );

          ALTER TABLE products ADD COLUMN IF NOT EXISTS category_id INT NULL;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS sku VARCHAR(100) NULL;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS barcode VARCHAR(100) NULL;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12,2) NULL;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INT NOT NULL DEFAULT 0;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS sales_velocity DECIMAL(10,2) NOT NULL DEFAULT 0.00;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_out_date TIMESTAMP NULL;
          ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'fk_products_category'
            ) THEN
              ALTER TABLE products ADD CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;
            END IF;
          END $$;

          CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);
          CREATE INDEX IF NOT EXISTS idx_products_category ON products (category_id);
          CREATE INDEX IF NOT EXISTS idx_products_stock_out ON products (stock_out_date);
        `);

        // 3. Sales & Sale Items
        await tenantPool.query(`
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

          DO $$
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'fk_sale_items_sale'
            ) THEN
              ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE;
            END IF;
            IF NOT EXISTS (
              SELECT 1 FROM pg_constraint WHERE conname = 'fk_sale_items_product'
            ) THEN
              ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
            END IF;
          END $$;

          CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items (sale_id);
          CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items (product_id);
        `);

        console.log(`Tenant #${tenant.id} schema successfully updated and verified.`);
      } catch (err) {
        console.error(`Error processing tenant #${tenant.id}:`, err.message);
      } finally {
        await tenantPool.end();
      }
    }

    console.log('\n=== DB Migration Finished Successfully! ===');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await cpPool.end();
  }
}

runMigration();
