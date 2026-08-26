const { Pool } = require('pg');

async function verifyAnalytics() {
  const host = process.env.DB_HOST || 'postgres';
  const port = Number(process.env.DB_PORT) || 5432;
  const user = process.env.DB_USERNAME || 'postgres';
  const password = process.env.DB_PASSWORD || 'root';

  const tenantPool = new Pool({
    host,
    port,
    user,
    password,
    database: 'demo_store_sjsy9z',
  });

  const cpPool = new Pool({
    host,
    port,
    user,
    password,
    database: 'control_plane',
  });

  try {
    // 1. Simulate 500 sales directly in tenant DB
    console.log('Simulating 500 sales in demo_store_sjsy9z...');
    const prods = (await tenantPool.query('SELECT id, price FROM products')).rows;

    for (let i = 0; i < 500; i++) {
      const daysAgo = Math.random() * 28;
      const saleDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      const prod = prods[Math.floor(Math.random() * prods.length)];
      const qty = Math.floor(Math.random() * 5) + 1;
      const amount = Number(prod.price) * qty;

      const saleRes = await tenantPool.query(
        'INSERT INTO sales (total_amount, created_at) VALUES ($1, $2) RETURNING id',
        [amount, saleDate]
      );
      await tenantPool.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [saleRes.rows[0].id, prod.id, qty, prod.price]
      );
    }

    // 2. Recalculate velocities in tenant DB
    console.log('Recalculating velocity and stock-out dates for each product...');
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const p of prods) {
      const soldRes = await tenantPool.query(
        `SELECT COALESCE(SUM(si.quantity), 0) as total_sold
         FROM sale_items si
         JOIN sales s ON si.sale_id = s.id
         WHERE si.product_id = $1 AND s.created_at >= $2`,
        [p.id, thirtyDaysAgo]
      );
      const totalSold = Number(soldRes.rows[0].total_sold);
      const velocity = Number((totalSold / 30).toFixed(2));

      const prodInfo = (await tenantPool.query('SELECT stock_quantity FROM products WHERE id = $1', [p.id])).rows[0];
      let stockOutDate = null;
      if (velocity > 0 && prodInfo.stock_quantity > 0) {
        const daysLeft = prodInfo.stock_quantity / velocity;
        stockOutDate = new Date(Date.now() + daysLeft * 24 * 60 * 60 * 1000);
      } else if (prodInfo.stock_quantity === 0) {
        stockOutDate = new Date();
      }

      await tenantPool.query(
        'UPDATE products SET sales_velocity = $1, stock_out_date = $2 WHERE id = $3',
        [velocity, stockOutDate, p.id]
      );
    }

    // 3. Output results from tenant DB
    const results = await tenantPool.query(`
      SELECT p.id, p.name, p.stock_quantity, p.sales_velocity, p.stock_out_date
      FROM products p
      ORDER BY p.stock_out_date ASC NULLS LAST
      LIMIT 5
    `);

    console.log('\nTop 5 Products by Urgency in Tenant DB:');
    console.table(results.rows);

    const countSales = (await tenantPool.query('SELECT COUNT(*) FROM sales')).rows[0].count;
    const countItems = (await tenantPool.query('SELECT COUNT(*) FROM sale_items')).rows[0].count;
    console.log(`\nTenant DB Total Sales: ${countSales}, Total Sale Items: ${countItems}`);

    // Verify control_plane table list
    const cpTables = (await cpPool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")).rows.map(r => r.table_name);
    console.log('Control Plane Tables (Confirming zero domain tables):', cpTables);

  } finally {
    await tenantPool.end();
    await cpPool.end();
  }
}

verifyAnalytics().catch(console.error);
