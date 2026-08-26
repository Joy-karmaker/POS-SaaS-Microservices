import { Pool } from 'pg';

async function runMigration() {
  const host = process.env.DB_HOST || '127.0.0.1';
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
    // 1. Check if control_plane has tenants
    const tenantsRes = await cpPool.query('SELECT id, name, db_name, db_username FROM tenants');
    console.log(`Found ${tenantsRes.rows.length} tenants in control_plane.`);

    // 2. Check if legacy tables exist in control_plane
    const tablesCheck = await cpPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('categories', 'products', 'sales', 'sale_items')
    `);

    const legacyTables = tablesCheck.rows.map(r => r.table_name);
    console.log(`Legacy tables found in control_plane:`, legacyTables);

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
        // Ensure proper schema in tenant DB
        console.log(`Ensuring schema in ${tenant.db_name}...`);
        await tenantPool.query(`
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
            updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
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
            price DECIMAL(12,2) NOT NULL,
            CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
            CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
          );

          CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items (sale_id);
          CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items (product_id);
        `);

        // Migrate data if legacy tables exist in control_plane
        if (legacyTables.includes('categories')) {
          const cats = await cpPool.query('SELECT id, name, description, created_at, updated_at FROM categories WHERE tenant_id = $1', [tenant.id]);
          console.log(`Migrating ${cats.rows.length} categories for tenant #${tenant.id}...`);
          for (const c of cats.rows) {
            await tenantPool.query(
              'INSERT INTO categories (id, name, description, created_at, updated_at) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
              [c.id, c.name, c.description, c.created_at, c.updated_at]
            );
          }
          if (cats.rows.length > 0) {
            await tenantPool.query("SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 1) FROM categories))");
          }
        }

        if (legacyTables.includes('products')) {
          const prods = await cpPool.query('SELECT id, category_id, name, sku, barcode, price, cost_price, stock_quantity, is_active, sales_velocity, stock_out_date, created_at, updated_at FROM products WHERE tenant_id = $1', [tenant.id]);
          console.log(`Migrating ${prods.rows.length} products for tenant #${tenant.id}...`);
          for (const p of prods.rows) {
            await tenantPool.query(
              `INSERT INTO products (id, category_id, name, sku, barcode, price, cost_price, stock_quantity, is_active, sales_velocity, stock_out_date, created_at, updated_at) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
               ON CONFLICT (id) DO NOTHING`,
              [p.id, p.category_id, p.name, p.sku, p.barcode, p.price, p.cost_price, p.stock_quantity, p.is_active, p.sales_velocity, p.stock_out_date, p.created_at, p.updated_at]
            );
          }
          if (prods.rows.length > 0) {
            await tenantPool.query("SELECT setval('products_id_seq', (SELECT COALESCE(MAX(id), 1) FROM products))");
          }
        }

        if (legacyTables.includes('sales')) {
          const sales = await cpPool.query('SELECT id, total_amount, created_at FROM sales WHERE tenant_id = $1', [tenant.id]);
          console.log(`Migrating ${sales.rows.length} sales for tenant #${tenant.id}...`);
          for (const s of sales.rows) {
            await tenantPool.query(
              'INSERT INTO sales (id, total_amount, created_at) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
              [s.id, s.total_amount, s.created_at]
            );
          }
          if (sales.rows.length > 0) {
            await tenantPool.query("SELECT setval('sales_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sales))");
          }
        }

        if (legacyTables.includes('sale_items')) {
          const saleItems = await cpPool.query(`
            SELECT si.id, si.sale_id, si.product_id, si.quantity, si.price 
            FROM sale_items si 
            JOIN sales s ON si.sale_id = s.id 
            WHERE s.tenant_id = $1
          `, [tenant.id]);
          console.log(`Migrating ${saleItems.rows.length} sale items for tenant #${tenant.id}...`);
          for (const si of saleItems.rows) {
            await tenantPool.query(
              'INSERT INTO sale_items (id, sale_id, product_id, quantity, price) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING',
              [si.id, si.sale_id, si.product_id, si.quantity, si.price]
            );
          }
          if (saleItems.rows.length > 0) {
            await tenantPool.query("SELECT setval('sale_items_id_seq', (SELECT COALESCE(MAX(id), 1) FROM sale_items))");
          }
        }

        console.log(`Tenant #${tenant.id} migration completed successfully.`);
      } catch (err: any) {
        console.error(`Error processing tenant #${tenant.id}:`, err.message);
      } finally {
        await tenantPool.end();
      }
    }

    // 3. Drop legacy tables from control_plane database
    if (legacyTables.length > 0) {
      console.log('\n--- Dropping legacy domain tables from control_plane ---');
      await cpPool.query(`
        DROP TABLE IF EXISTS sale_items CASCADE;
        DROP TABLE IF EXISTS sales CASCADE;
        DROP TABLE IF EXISTS products CASCADE;
        DROP TABLE IF EXISTS categories CASCADE;
      `);
      console.log('Successfully dropped legacy tables (sale_items, sales, products, categories) from control_plane.');
    } else {
      console.log('\ncontrol_plane already does not have legacy domain tables.');
    }

    console.log('\n=== DB Migration Finished Successfully! ===');
  } catch (err: any) {
    console.error('Migration failed:', err);
  } finally {
    await cpPool.end();
  }
}

runMigration();
